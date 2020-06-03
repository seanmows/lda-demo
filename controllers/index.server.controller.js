exports.render = (req, res) => {
    if (req.session.lastVisit) {
        // Log last visit time for testing sessions
        console.log('Last Visit:', req.session.lastVisit);
    }
    req.session.lastVisit = new Date();

};
