// Hiển thị giao diện người dùng (UI) khi plugin được chạy
figma.showUI(__html__, { width: 380, height: 600, title: "Play Store Icon Finder" });

// Lắng nghe các thông điệp được gửi từ file ui.html
figma.ui.onmessage = async (msg) => {
    // Chỉ xử lý thông điệp import nhiều icon từ nút "Import to Figma"
    console.log(msg);
    if (msg.type === 'import-multiple') {
        const items = msg.items;

        if (items.length === 0) return;

        figma.notify(`Đang chuẩn bị nhập ${items.length} icon...`);
        const newNodes = [];

        for (const item of items) {
            try {
                await figma.createImageAsync(item.url).then(async (image) => {
                    const frame = figma.createFrame();
                    frame.fills = [];
                    frame.resize(512, 512);
                    frame.name = item.name + ' • ' + item.developer;

                    const rect = figma.createRectangle();
                    rect.resize(512, 512);
                    rect.name = '512x512';
                    rect.fills = [{ type: 'IMAGE', scaleMode: 'FILL', imageHash: image.hash }];

                    frame.appendChild(rect);

                    rect.x = (frame.width - rect.width) / 2;
                    rect.y = (frame.height - rect.height) / 2;

                    newNodes.push(frame);
                });
            } catch (e) {
                console.error(`Không thể tải icon cho: ${item.name}`, e);
                figma.notify(`Lỗi khi tải icon cho "${item.name}"`, { error: true });
            }
        }

        // Sắp xếp các icon trong group thành một hàng ngang cho dễ nhìn
        let xOffset = 0;
        const spacing = 60; // Khoảng cách giữa các icon
        for (const node of newNodes) {
            node.x = node.x + xOffset;
            node.y = node.y;
            xOffset += 512 + spacing;
        }

        // Thông báo kết quả cuối cùng
        if (newNodes.length > 0) {
            figma.currentPage.selection = newNodes; // Chọn tất cả các icon mới
            figma.viewport.scrollAndZoomIntoView(newNodes);
            figma.notify(`✅ Đã nhập thành công ${newNodes.length} icon.`, { timeout: 3000 });
        } else {
            figma.notify(`❌ Không nhập được icon nào.`, { error: true });
        }
    } else if (msg.type === 'search-apps') {
        const { term, country, page, limit } = msg; // Không cần API Key từ UI nữa

        if (!term) {
            figma.notify('Vui lòng nhập từ khóa tìm kiếm.', { error: true });
            return;
        }

        // URL API của server Vercel (được inject từ Webpack)
        const VERCEL_API_BASE_URL = process.env.VERCEL_API_URL;
        // API Key của plugin (được inject từ Webpack)
        const FIGMA_PLUGIN_API_KEY = process.env.FIGMA_PLUGIN_API_KEY;

        if (!VERCEL_API_BASE_URL || !FIGMA_PLUGIN_API_KEY) {
            figma.notify('Lỗi cấu hình plugin: Thiếu URL API hoặc Plugin API Key.', { error: true });
            console.error('Plugin configuration error: VERCEL_API_URL or FIGMA_PLUGIN_API_KEY is missing.');
            return;
        }

        figma.notify(`Đang tìm kiếm "${term}"...`, { timeout: 5000 });
        try {
            const url = new URL(`${VERCEL_API_BASE_URL}/search`); // Ghép URL API và endpoint search
            url.searchParams.append('term', term);
            if (country) url.searchParams.append('country', country);
            if (page) url.searchParams.append('page', page);
            if (limit) url.searchParams.append('limit', limit);

            const response = await fetch(url.toString(), {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': FIGMA_PLUGIN_API_KEY // Gửi API Key của plugin trong header
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Server responded with status ${response.status}`);
            }

            const data = await response.json();
            figma.ui.postMessage({ type: 'search-results', results: data.data, hasMore: data.hasMore, currentPage: data.currentPage, source: data.source });
            figma.notify(`Tìm thấy ${data.data.length} kết quả (Trang ${data.currentPage}). Nguồn: ${data.source}.`);

        } catch (error) {
            console.error('Lỗi khi gọi API tìm kiếm:', error);
            figma.notify(`Lỗi khi tìm kiếm: ${error.message}`, { error: true });
        }
    }
};