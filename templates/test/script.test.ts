//#region imports
import { describe, test, before } from "node:test"
import assert from "node:assert"
// initializes global state (source, http, bridge, etc.)
import "@kaidelorenzo/grayjay-polyfill"

// Import your script from the build output
import "../dist/script.js"
//#endregion

describe("{{PLATFORM_NAME}} Plugin Tests", { skip: false }, () => {
    before(() => {
        // Initialize the plugin source
        if (source.enable) {
            source.enable({ id: "test-plugin-id" }, {})
        }
    })

    test("source should be initialized", { skip: false }, () => {
        assert.ok(source, "source object should exist")
        assert.ok(source.enable, "source.enable should exist")
        assert.ok(source.getHome, "source.getHome should exist")
    })

    test("getHome should return video results", { skip: false }, () => {
        const result = source.getHome()
        assert.ok(result, "getHome should return a result")
        assert.ok(Array.isArray(result.results) || result.results, "results should be an array or pager")
        
        // For skeleton plugins, this might be empty
        console.log(`getHome returned ${Array.isArray(result.results) ? result.results.length : 'pager'} results`)
    })

    // Add more tests based on your plugin's capabilities
    // Uncomment and customize as needed:

    /*
    test("searchChannels should work", { skip: false }, () => {
        if (!source.searchChannels) {
            throw new Error("searchChannels is not implemented")
        }
        const query = "test"
        const results = source.searchChannels(query)
        assert.ok(results, "searchChannels should return results")
    })
    */

    /*
    test("getChannelContents should work", { skip: false }, () => {
        if (!source.getChannelContents) {
            throw new Error("getChannelContents is not implemented")
        }
        const channelUrl = "https://{{PLATFORM_URL}}/channel/test"
        const results = source.getChannelContents(channelUrl)
        assert.ok(results, "getChannelContents should return results")
    })
    */

    /*
    test("utility function example", { skip: false }, () => {
        // Import and test your utility functions
        // import { myUtilFunction } from "../src/utils.js"
        // const result = myUtilFunction("input")
        // assert.strictEqual(result, "expected output")
    })
    */
})
