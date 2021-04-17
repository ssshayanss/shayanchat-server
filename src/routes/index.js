const path = require('path');
const router = require('express').Router();
const authRoutes = require('./auth.routes');

router.get('/', (req, res) => {
    res.status(200).sendFile(path.join(__dirname, '../../public/index.html'));
});

router.use('/api/auth', authRoutes);

module.exports = router;