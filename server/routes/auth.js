const express = require('express');
const router = express.Router();

/**
 * Login endpoint
 * POST /api/login/account
 */
router.post('/login/account', async (req, res) => {
  const { password, username, type } = req.body;

  try {
    // Admin kullanıcısı kontrolü
    if (password === 'admin' && username === 'admin') {
      return res.json({
        status: 'ok',
        type,
        currentAuthority: 'admin',
        success: true,
      });
    }

    // Kullanıcı kontrolü
    if (password === 'ant.design' && username === 'user') {
      return res.json({
        status: 'ok',
        type,
        currentAuthority: 'user',
        success: true,
      });
    }

    // Mobile login
    if (type === 'mobile') {
      return res.json({
        status: 'ok',
        type,
        currentAuthority: 'admin',
        success: true,
      });
    }

    // Login başarısız
    return res.json({
      status: 'error',
      type,
      currentAuthority: 'guest',
      success: false,
      errorMessage: 'Kullanıcı adı veya şifre hatalı',
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      errorMessage: 'Sunucu hatası',
    });
  }
});

/**
 * Logout endpoint
 * POST /api/login/outLogin
 */
router.post('/login/outLogin', async (req, res) => {
  try {
    res.json({
      data: {},
      success: true,
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      errorMessage: 'Sunucu hatası',
    });
  }
});

/**
 * Get current user
 * GET /api/currentUser
 */
router.get('/currentUser', async (req, res) => {
  try {
    // Bu örnekte session kontrolü yok, her zaman admin user döndürüyoruz
    // Gerçek uygulamada session veya JWT kontrolü yapılmalı
    res.json({
      success: true,
      data: {
        name: 'Admin',
        avatar: 'https://gw.alipayobjects.com/zos/antfincdn/XAosXuNZyF/BiazfanxmamNRoxxVxka.png',
        userid: '00000001',
        email: 'admin@teymur.com',
        signature: 'Teymur Mailing System',
        title: 'System Administrator',
        group: 'Teymur Admin',
        tags: [
          {
            key: '0',
            label: 'Admin',
          },
        ],
        notifyCount: 0,
        unreadCount: 0,
        country: 'Turkey',
        access: 'admin',
        geographic: {
          province: {
            label: 'Istanbul',
            key: '34',
          },
          city: {
            label: 'Istanbul',
            key: '34',
          },
        },
        address: 'Istanbul',
        phone: '0555-555-5555',
      },
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      errorMessage: 'Sunucu hatası',
    });
  }
});

/**
 * Get captcha
 * GET /api/login/captcha
 */
router.get('/login/captcha', async (req, res) => {
  try {
    // Mock captcha
    res.json({
      success: true,
      data: 'captcha-xxx',
    });
  } catch (error) {
    console.error('Get captcha error:', error);
    res.status(500).json({
      success: false,
      errorMessage: 'Sunucu hatası',
    });
  }
});

module.exports = router;
