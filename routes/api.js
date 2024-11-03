'use strict';

module.exports = function (app) {
  const likes = new Map();

  app.route('/api/stock-prices')
    .get(async function (req, res){
      try {
        const { stock, like } = req.query;
        const ip = req.ip;
        
        // Handle single or multiple stocks
        const stocks = Array.isArray(stock) ? stock : [stock];
        
        // Fetch stock data for all requested stocks
        const stockData = await Promise.all(stocks.map(async (symbol) => {
          const response = await fetch(`https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${symbol}/quote`);
          const data = await response.json();
          
          const key = symbol.toUpperCase();
          if (like && (!likes.has(`${ip}-${key}`) || !likes.get(`${ip}-${key}`))) {
            likes.set(`${ip}-${key}`, true);
          }
          
          const totalLikes = Array.from(likes.entries())
            .filter(([k]) => k.endsWith(`-${key}`))
            .length;
          
          return {
            stock: key,
            price: data.latestPrice,
            likes: totalLikes
          };
        }));
        
        // Return appropriate response format
        if (stockData.length === 1) {
          res.json({ stockData: stockData[0] });
        } else {
          const [stock1, stock2] = stockData;
          const rel_likes1 = stock1.likes - stock2.likes;
          const rel_likes2 = stock2.likes - stock1.likes;
          
          res.json({
            stockData: [
              { stock: stock1.stock, price: stock1.price, rel_likes: rel_likes1 },
              { stock: stock2.stock, price: stock2.price, rel_likes: rel_likes2 }
            ]
          });
        }
      } catch (error) {
        res.status(500).json({ error: 'Error fetching stock data' });
      }
    });
};
