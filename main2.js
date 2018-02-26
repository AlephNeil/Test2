'use strict';

// console.log('Hello world!');
// const myname = "Neil"
// const blah = `alpha ${myname} beta`
// console.log(`The value of blah is ${blah}`)

// var webdriver = require('selenium-webdriver');
// var browser = new webdriver.Builder()
//     .usingServer()
//     .withCapabilities({'browserName': 'chrome'})
//     .build();

// browser.get('http://en.wikipedia.org/wiki/Wiki');
// browser.findElements(webdriver.By.css('[href^="/wiki/"]'))
//     .then(function(links) {
//     console.log('Found', links.length, 'Wiki links.' )
//     browser.quit();
// });


// div.srg = list of search results
// div.rc = single result
//  h3.r > a = the link part of the result
//  span.st = the text part of the result


require('chromedriver');
// const chromedriver = require('chromedriver');
const webdriver = require('selenium-webdriver');
// const cd = require('selenium-webdriver/chrome');
// const options = new cd.Options();
// options.setChromeBinaryPath(chromedriver.path);
// options.addArguments('headless', 'disable-gpu');
const driver = new webdriver.Builder()
    .forBrowser('chrome')
    //.setChromeOptions(options)
    .build();

const prefix = "https://www.google.co.uk/"
const eltId = 'lst-ib'
const formId = 'tsf'

const postCodePtrn = /\b[A-Z]{1,2}[O0-9]{1,2}[A-Z]?\s[0-9][A-Z]{2}\b/;

function matchie(ptrn, s, n) {
    var alpha = ptrn.exec(s);
    if (!alpha) {
        return null;
    }
    var ind = alpha.index;
    var pc = alpha[0];
    var pref = s.slice(ind < n ? 0 : ind - n, ind) + pc;
    return [pc, pref];
}

function googSearch(q, cb) {
    driver.get(prefix).then(res => {
        var script = `document.getElementById('${eltId}').value = '${q}'`;
        // console.log(script);
        driver.executeScript(script).then(res => {
            driver.executeScript(`document.getElementById('${formId}').submit()`)
                .then(cb);
        });
    });
}
console.log('here');
const myscript = `var arr = document.querySelectorAll('span.st');
return [].slice.call(arr).map(elt => elt.innerText );`

googSearch('32 Harbury Road', () => {
    driver.executeScript(myscript).then(res => {
        var alpha = res
            .map(s => matchie(postCodePtrn, s, 60))
            .filter(x => x !== null);
        var beta = {};
        var gamma = {};
        alpha.forEach(tup => {
            var pc = tup[0];
            if (pc in beta) {
                beta[pc]++;
            } else {
                beta[pc] = 1;
                gamma[pc] = tup[1];
            }
        });
        for (var pc in beta) {
            console.log(`"${pc}",${beta[pc]},"${gamma[pc]}"`)
        }

            // .forEach((tup, i) => {
            //     console.log(i+','+tup[0]+','+tup[1]);
            // });
        // console.log(alpha);
        console.log("Goodbye!");
    });
});
// function getMeTheCode(addr) {
//     driver.get
// }