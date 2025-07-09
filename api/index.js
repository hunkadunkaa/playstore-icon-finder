// server.js
import express from 'express';
import gplay from 'google-play-scraper';
import cors from 'cors';

const app = express();

// --- Caching Logic ---
// Sử dụng Map để lưu cache. Key: "term:country", Value: { results: [], timestamp: Date }
const cache = new Map();
const CACHE_TTL_MS = 1000 * 60 * 30; // Cache tồn tại trong 30 phút

const API_KEY = process.env.API_KEY;
app.use(cors());

const authenticateApiKey = (req, res, next) => {
  const incomingApiKey = req.headers['x-api-key'];

  if (!API_KEY) {
      // Cảnh báo nếu API_KEY không được cấu hình trên Vercel
      console.error('Lỗi cấu hình: Biến môi trường API_KEY của server chưa được đặt.');
      return res.status(500).json({ error: 'Server API Key chưa được cấu hình.' });
  }

  if (!incomingApiKey || incomingApiKey !== API_KEY) {
      return res.status(403).json({ error: 'Truy cập bị từ chối: API Key không hợp lệ hoặc bị thiếu.' });
  }
  next(); // API Key hợp lệ, tiếp tục xử lý request
};

app.get('/api/search', async (req, res) => {
  const { term, country = 'us', page = 1, limit = 10 } = req.query;

  if (!term) {
    return res.status(400).json({ error: 'Vui lòng cung cấp từ khóa tìm kiếm (term).' });
  }

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const cacheKey = `${term.toLowerCase().trim()}:${country}`;

  // --- BƯỚC 1: KIỂM TRA CACHE ---
  if (cache.has(cacheKey)) {
    const cachedEntry = cache.get(cacheKey);
    console.log(`[CACHE HIT] Trả về kết quả từ cache cho: "${term}" trang ${pageNum}`);
    
    // Phân trang từ dữ liệu cache
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = pageNum * limitNum;
    const pageResults = cachedEntry.results.slice(startIndex, endIndex);
    const hasMore = endIndex < cachedEntry.results.length;

    return res.json({
      data: pageResults,
      currentPage: pageNum,
      hasMore: hasMore,
      source: 'cache' // Cho frontend biết dữ liệu từ cache
    });
  }

  // --- BƯỚC 2: NẾU KHÔNG CÓ CACHE, GỌI API ---
  console.log(`[CACHE MISS] Gọi API lần đầu cho: "${term}"`);
  try {
    // Tải toàn bộ danh sách (tối đa 250) để lưu vào cache
    const allResults = await gplay.search({
      term: term,
      num: 250, // Lấy số lượng tối đa để cache
      country: country
    });

    // Lưu vào cache với thời gian sống (TTL)
    cache.set(cacheKey, {
      results: allResults,
      timestamp: Date.now()
    });
    
    // Tự động xóa cache cũ sau một khoảng thời gian
    setTimeout(() => {
        cache.delete(cacheKey);
        console.log(`[CACHE EXPIRED] Đã xóa cache cho: ${cacheKey}`);
    }, CACHE_TTL_MS);

    // Phân trang từ dữ liệu vừa tải về cho trang đầu tiên
    const pageResults = allResults.slice(0, limitNum);
    const hasMore = limitNum < allResults.length;

    res.json({
      data: pageResults,
      currentPage: 1, // Luôn trả về trang 1 cho lần gọi đầu tiên
      hasMore: hasMore,
      source: 'api' // Cho frontend biết dữ liệu từ API
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Đã có lỗi xảy ra ở phía máy chủ.' });
  }
});

export default app;

// app.listen(PORT, () => {
//   console.log(`Máy chủ API (có cache) đang chạy tại http://localhost:${PORT}`);
// });
