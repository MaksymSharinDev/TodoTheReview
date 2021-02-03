import exec from 'await-exec';
import fs from 'fs';
import os from 'os';
//a chunk stops after 10.000 chars
export default class SetupReviewFiles {
    constructor() {

        this._notCodeFileExtensions = [
            //for discover extensions
            //find . -type f | sed -n 's/..*\.//p' | sort | uniq -c
            "gif",
            "svg",
            "png",
            "jpeg",
            "ico",
            "ttf",
            "git",
            "idea"
        ]

        this._getGitIgnored = this._getGitIgnored.bind(this);
        this._getSubFolders = this._getSubFolders.bind(this);
        this._getCreationPaths = this._getCreationPaths(this);
    }

    _getReviewHeader( chunkID , chunkFiles ){
        let reviewHeader =
            `#TODO REVIEW CHUNK N. ${chunkID}` + "\n" +
            `#REVIEW-TARGETS:`+ "\n";
            //#<TARGETFILES>
            chunkFiles.forEach(
                (index, filePath,chunkFiles )=>
                {reviewHeader += filePath + "\n"}
            );
            reviewHeader += `#REVIEW-LAST: NONE` + "\n"
            return reviewHeader
    }

    async _getGitIgnored (){
        // command:
        // cat .gitignore | grep -v "#"
        // populate an array with non-empty lines
        let command =
            ' cat .gitignore ' +          // ask .gitignore content
            ' | grep -v "#" ' +           //filter out comments
            ' | grep -v "^[[:space:]]*$"' //filter out empty lines

        let ret = await exec(  command, (error, stdout, stderr) => {
            if (error) {
                console.log(`error: ${error.message}`);
                return;
            }
            if (stderr) {
                console.log(`stderr: ${stderr}`);
                return;
            }
        });
        let excludedFolders = ret.stdout.split(os.EOL);
        excludedFolders.push(".git");
        return excludedFolders;
    }
    async _getSubFolders(){
        /*
            command:
            find . -type d
            | grep -v path/to/ignore
        */
        let command = "find . -type d ";
        let commandExcludeFolder =
            (folder) => { return `| grep -v "${folder}" `} ;
        let gitIgnoredArray = await this._getGitIgnored();
        gitIgnoredArray.forEach
        ((path, index, gitIgnored) => {
            if( path === "") return;
            command += commandExcludeFolder(path);
        });
        let ret = await exec(command);
        let subfolders = ret.stdout.split("\n");
        subfolders.pop();
        //subfolders.shift();
        subfolders.forEach(
            (path,index,subfolders)=>{
                if( path === "")  return;
                subfolders[index] = path + "/";
            }
        );
        return subfolders;

    }
    async _countFileChars(path,filename){
        //Example:
        //wc -l ./src/utils/checkStore.js
        //21 ./src/utils/checkStore.js
        //handle "Is a directory"
        //handle Extension checking
        let excludedExtsRegExp = new RegExp( '\\b' + this._notCodeFileExtensions.join('\\b|\\b') + '\\b')
        if( filename.match(excludedExtsRegExp) !== null ){
            return 0
        }
        let ret = {};
        try{
            ret = await exec(
            `wc -l ${ path + filename }`
        )
        }catch(e){
            console.log("wc command failed, assigned value 0 to file");
            ret = { stdout : "0"};
        }
        let output = ret.stdout;
        let result = output.match(/\d*/);

        return result
    }
    async _getCreationPaths(){
        let reviewFilesTargets = [];

        let subfolders = await this._getSubFolders();
        for( let i = 0 ; i<subfolders.length ; i++ ){
            let folderPath = subfolders[i]
            let filenamesArray = await fs.readdirSync( folderPath ,{withFileTypes: false} );
            filenamesArray = filenamesArray.filter( (fileName, index)=>{
                   return !(fileName.match(/.*\..*/) === null);
            });
            if (filenamesArray.length > 0) {
                let charForFileArray = [];
                for (let i = 0; i < filenamesArray.length; i++){
                    let fileName = filenamesArray[i];
                    charForFileArray.push(
                        JSON.stringify(
                            {
                                filename: fileName,
                                charCount: await this._countFileChars(folderPath,fileName)
                            })
                    );
                }

                reviewFilesTargets.push(
                    {
                        folderPath : folderPath,
                        //we just put the filename list
                        //and get an Array of objects
                        //[ {filename: name , charCount : 0 }]
                        fileList : charForFileArray
                    }
                );
            }
        }
        console.log(reviewFilesTargets);
        this._reviewFilesTargets = reviewFilesTargets;
    }
}