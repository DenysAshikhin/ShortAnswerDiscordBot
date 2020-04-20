const fs = require('fs');
const readline = require('readline');

var lineArray = new Array();
var tempLine = "```";




async function processLineByLine() {
    const fileStream = fs.createReadStream('unit5.txt');

    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });
    // Note: we use the crlfDelay option to recognize all instances of CR LF
    // ('\r\n') in input.txt as a single line break.

    for await (const line of rl) {
        // Each line in input.txt will be successively available here as `line`.
        if (line.length > 1) {

            if (line.includes("Unit 5 - ")) {

                tempLine += " || " + line + "```";
                lineArray.push(tempLine);
                tempLine = "```";
            }
            else {
                tempLine += line;
            }
        }
    }
    console.log(lineArray);

    let final2 = {
                    "pptName": "Unit 5",
                    "slides": lineArray
    };

    fs.writeFile("unit5.json", JSON.stringify(final2), function(err, result) {
        if(err) console.log('error', err);
    });
}


processLineByLine();