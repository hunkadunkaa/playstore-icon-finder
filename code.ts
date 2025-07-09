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
    }
};