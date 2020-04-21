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

                if (previous == Number(line)) {

                    lineArray[lineArray.length - 1] += tempLine;
                    tempLine = "";
                    previous = Number(line);
                }
                else if (((Number(line) - counter) == 1) && previous != Number(line)) {


                    previous = Number(line);
                    counter = previous;

                    tempLine += " || SLIDE #: " + previous + "";
                    lineArray.push(tempLine);

                    let tempArray = lineArray[lineArray.length - 1].split(" || ");
                    let holder = tempArray[1];
                    tempArray[1] = tempArray[0];
                    tempArray[0] = holder;

                    lineArray[lineArray.length - 1] = tempArray.join(" || ");

                    tempLine = "";
                }
                else {
                    tempLine += line + " \n ";
                }
            }
            else {
                tempLine += line + " \n ";
            }
        }
    }

    console.log("final length: " + lineArray.length);
    let final2 = {
        "pptName": "L4_Knauer-TDM",
        "slides": lineArray
    };

    fs.writeFile("L4_Knauer-TDM.json", JSON.stringify(final2), function (err, result) {
        if (err) console.log('error', err);
    });
}


processLineByLine();