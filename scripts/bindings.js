const assert = require('assert');

const bindings = (() => {
    let binding;
    try {
        binding = require('../build/Release/bao_curl_node_addon.node')
    } catch (error) {
        
    }
    try {
        binding ||= require('./postinstall');
        const BaoLibCurl = binding.BaoLibCurl;
        assert.ok(BaoLibCurl, 'Failed to read target BaoLibCurl from native binary.');
        return binding;
    } catch (_) {
        throw _;
    }
})();

module.exports = bindings;