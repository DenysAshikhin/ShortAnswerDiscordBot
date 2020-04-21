const fs = require('fs');
const readline = require('readline');

var lineArray = new Array();
var tempLine = "";
var tempLine1 = "";

var counter = 0;

var previous = 0;




async function processLineByLine() {
    const fileStream = fs.createReadStream('L4_Knauer-TDM.txt');

    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });
    // Note: we use the crlfDelay option to recognize all instances of CR LF
    // ('\r\n') in input.txt as a single line break.

    for await (const line of rl) {
        // Each line in input.txt will be successively available here as `line`.

        if (line.length >= 1) {

            if (!isNaN(line)) {

                if(previous == Number(line)){
                    let tempArray = lineArray[lineArray.length - 1].split(" || ");
                    tempArray[0] += ".\n" + tempLine;
                    lineArray[lineArray.length - 1] = tempArray.join(" || ");
                    previous = Number(line);
                }
                else{

                    previous = Number(line);
                    tempLine += " || SLIDE #: " + line + "";
                    lineArray.push(tempLine);
                    tempLine = "";
                }
            }
            else {
                tempLine += line;
            }
        }
    }

    console.log("final length: " + lineArray.length);
    let final2 = {
        "pptName": "L4-Knauer-TDM",
        "slides": lineArray
    };

    fs.writeFile("L4-Knauer-TDM.json", JSON.stringify(final2), function (err, result) {
        if (err) console.log('error', err);
    });
}


processLineByLine();