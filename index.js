//#IDEAS
//take arguments like -setup , -start , -update, -clear, -{setting-name} <value> etc..
//add a config  file
//add a .review hidden folder for track on file reviews operations

import SetupReviewFiles from './SetupReviewFiles';
import exec from "await-exec";

/* Testing */
exec("clear");
let directory = "../Test-Repo4-TodoTheReview"
process.chdir(directory);
/* Testing */





//MAIN


let setupReviewFiles = new SetupReviewFiles();
    setupReviewFiles._getCreationPaths




//getGitIgnored();




