const bindings = (() => {
    let binding;
    try {
        binding = require('./postinstall');
        const BaoLibCurl = binding.BaoLibCurl;
        assert.ok(BaoLibCurl, 'Failed to read target BaoLibCurl from native binary.');
        return binding;
    } catch (_) {
        throw _;
    }
})();

module.exports = bindings;