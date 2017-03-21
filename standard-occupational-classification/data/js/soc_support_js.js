/*
This code was written by James P Harris, Senior Research Officer,
ONS London Regional Office in September/October 2012
This code is protected by Crown Copyright and is not to be copied
nor distributed without permission from the author

This code supports an HTML page containing the facility for users 
to either display details of ONS SOC codes, or to search for the
SOC code based upon their job description

This tool is in addition to standard publications and customer
service lines - it simply provides additional functionality 
for users to conduct their own searches

Any questions, comments or feedback, please contact soc@ons.gsi.gov.uk
*/

// killme is the variable used to define when to cancel a search
// if it is true, cancel the search as soon as possible
var killme = false;

// SPEDIS data matching function: calculate the "spelling distance"
//   required to convert one term into another term
//   eg hook & book requires changing one letter, the first letter = score 200
// This function was built from scratch by the author
// USED IN: "match" macro only
// LEADS TO: self-contained function
function spedis(known_value, search_term) {
	score = 0;
	reason = "";
	knwn = known_value.split('');
	srch = search_term.split('');
	pointerK = 0; pointerS = 0;
	end_analysis = 0;

	// start off by matching the first letter, or creating it if necessary
	if (knwn[0] == srch[0]) {
		// first letter matches
		pointerK = 1; pointerS = 1;
	} else if (known_value.length > 1 && knwn[0] == srch[1]) {
		// first letter of known matches second letter of search
		if (knwn[0] == srch[1] && knwn[1] == srch[0]) {
	 		// first two letters are transposed (eg TA instead of AT)
			pointerK = 2; pointerS = 2;
	 		score = score + 50;
	 		reason = reason + "had to transpose first two letters<BR>";
		} else {
	 		 // first letter of search must be wrong - delete it
	 		pointerK = 1; pointerS = 2;
	 		score = score + 100;
	 		reason = reason + "had to delete first letter<BR>";
		};
	} else if (known_value.length > 2 && knwn[0] == srch[2]) {
		// first letter of known matches third letter of search
		if (knwn[0] == srch[2] && knwn[1] == srch[1]) {
	 		// the first letter is in third place AND two letters need swapping
	 		pointerK = 2; pointerS = 3;
	 		score = score + 50 + 100;
	 		reason = reason + "had to delete first letter and transpose remaining two letters<BR>";
		} else {
	 		// first two letters of search must be wrong - delete them
	 		pointerK = 1; pointerS = 3;
	 		score = score + 100 + 50;
	 		reason = reason + "had to delete first two letters<BR>";
		};
	} else if (known_value.length > 1 && knwn[1] == srch[0]) {
		// they must have missed the first letter
	 	pointerK = 1; pointerS = 0;
		score = score + 200;
		reason = reason + "had to insert the first letter<BR>";
	} else {
		pointerK = 1; pointerS = 1;
		score = score + 200;
		reason = reason + "had to replace first letter<BR>";
	};

	// now iterate through each subsequent letter of the search term and try matching it...
	do {
		if (pointerK >= known_value.length) {
			// if we've reached the end of the known word, delete any remaining characters in the search term and FINISH
			score = score + (50 * (search_term.length - pointerS));
			reason = reason + "had to truncate " + (search_term.length - pointerS) + " letters<BR>";
			end_analysis = 1;
		} else if (pointerS >= search_term.length) {
			// if we've reached the end of the search term, add any remaining characters in the known word and FINISH
			score = score + (35 * (known_value.length - pointerK));
			reason = reason + "had to append " + (known_value.length - pointerK) + " letters<BR>";
			end_analysis = 1;
		} else if (knwn[pointerK] == srch[pointerS]) {
			pointerK++; pointerS++; // letter matches, move on
			reason = reason + "letter match<BR>";
		} else if (search_term.length >= (pointerS+1) && knwn[pointerK] == srch[pointerS+1]) {
			// the next letter of the search term matches the current letter of the known word
			// are two letters transposed? or is it a duplicated letter? or an extra letter? or just a wrong letter?
			done = 0;
			if (done == 0 && knwn[pointerK-1] == srch[pointerS] && srch[pointerS-1] == srch[pointerS]) {
				pointerS++; // duplicate letter
				score = score + 25;
				reason = reason + "had to delete a duplicate letter<BR>";
				done = 1;
			};
			if (done == 0 && known_value.length >= (pointerK+1) && knwn[pointerK+1] == srch[pointerS]) {
				pointerK++; pointerS++; pointerK++; pointerS++; // two letters are transposed
				score = score + 50;
				reason = reason + "had to transpose two letters<BR>";
				done = 1;
			};
			if (done == 0) { pointerS++; score = score + 50; reason = reason + "had to delete a letter<BR>"; }; // delete this letter 
		} else if (known_value.length >= (pointerK+1) && knwn[pointerK+1] == srch[pointerS]) {
			pointerK++; // insert an extra letter
			score = score + 100;
			reason = reason + "had to insert a letter<BR>";
		} else if (knwn[pointerK] != srch[pointerS]) {
			if (known_value.length >= (pointerK+1) && knwn[pointerK+1] != srch[pointerS]) {
				if (search_term.length >= (pointerS+1) && knwn[pointerK] != srch[pointerS+1]) {
					pointerK++; pointerS++; // it's a wrong letter - replace it
					score = score + 100;
					reason = reason + "had to replace a letter<BR>";
				};
			};
		} else {
			// is there anything else?!
			alert("An error occurred while performing the Spedis calculation - please report this to james.p.harris@ons.gsi.gov.uk");
		};
	} while (end_analysis != 1);
	return (score/known_value.length);
};

// Levenstein data matching function: basic check of how many letters
//   between two words actually match; returns a proportional match
// USED IN: "match" macro only
// LEADS TO: self-contained function
function levenshtein2(str1, str2) {
	var l1 = str1.length, l2 = str2.length;
	if (Math.min(l1, l2) === 0) { return Math.max(l1, l2); };
	var i = 0, j = 0, d = [];
	for (i = 0 ; i <= l1 ; i++) { d[i] = []; d[i][0] = i; };
	for (j = 0 ; j <= l2 ; j++) { d[0][j] = j; };
	for (i = 1 ; i <= l1 ; i++) {
		for (j = 1 ; j <= l2 ; j++) {
			d[i][j] = Math.min(
			d[i - 1][j] + 1,
			d[i][j - 1] + 1,
			d[i - 1][j - 1] + (str1.charAt(i - 1) === str2.charAt(j - 1) ? 0 : 1)
			);
		}
	}
	return (1 - (d[l1][l2] / Math.max(l1, l2)));
}

// SoundEx calculates how closely two English words match in sound
//   eg their and there = match, but book and hook = no match
// This function was built from scratch by the author
// USED IN: "match" macro only
// LEADS TO: self-contained function
function soundex(text) {
	// take everything except the first letter, delete the non-soundex letters, then deduplicate doubled letters
	subtext = text.substr(1,text.length);
	subtext = subtext.replace(/[aeiouhwy ]+/g,'');
	deduplicate = subtext.replace(/[^\w\s]|(.)(?=\1)/gi, "");
	// build the soundex code starting with the first letter...
	//   then applying appropriate scores to each remaining letter
	sxcode = text.substr(0,1);
	for (j=0;j<subtext.length;j++) {
		switch (subtext.substr(j,1)) {
			default: score = 0; break;
			case "b": score = 1; break;
			case "p": score = 1; break;
			case "f": score = 1; break;
			case "v": score = 1; break;
			case "c": score = 2; break;
			case "s": score = 2; break;
			case "k": score = 2; break;
			case "g": score = 2; break;
			case "j": score = 2; break;
			case "q": score = 2; break;
			case "x": score = 2; break;
			case "z": score = 2; break;
			case "d": score = 3; break;
			case "t": score = 3; break;
			case "l": score = 4; break;
			case "m": score = 5; break;
			case "n": score = 5; break;
			case "r": score = 6; break;
		};
		sxcode = sxcode + score;
	};
	// deduplicate any doubled scores in the soundex code
	sxfinal = sxcode.replace(/[^\w\s]|(.)(?=\1)/gi, "");
	// append zeros to make it at least four digits long
	if (sxfinal.length < 4) {
		do { sxfinal = sxfinal + "0"; } while (sxfinal.length < 4);
	};
	return sxfinal;
};

// the matching function, which calls the SPEDIS, Levenstein and SoundEx functions
// generates a score of how well two terms match
// note that by this stage all odd characters, extra spaces, etc should have been filtered out
// USED IN: "dictionaryiteration" macro only
// LEADS TO: self-contained function, but calls SPEDIS, levenstein & soundex macros
function match(known_value, search_term) {
	// reset a few important variables to zero
	raw_spedis_score = 0; spedis_score = 0; lev_score = 1;
	sxscore1 = ""; sxscore2 = ""; sxmatch = 0; matchscore = 0;
	// check if they exactly match, in which case skip the calculations!
	if (known_value == search_term) {
		 matchscore = 100;
	} else {
		raw_spedis_score = spedis(known_value, search_term);
		spedis_score = (-0.01*raw_spedis_score*raw_spedis_score)-(1.05*raw_spedis_score)+100
		lev_score = levenshtein2(known_value, search_term) * 100;
		sxscore1 = soundex(known_value);
		sxscore2 = soundex(search_term);

		// combine the raw soundex scores into a matching criteria
		// this system was developed by the author and applies an additive, non-exclusive percentage matching system
		if (sxscore1.charAt(0) == sxscore2.charAt(0)) { sxmatch = sxmatch + 40; };
		if (sxscore1.charAt(1) == sxscore2.charAt(1)) { sxmatch = sxmatch + 25; };
		if (sxscore1.charAt(2) == sxscore2.charAt(2)) { sxmatch = sxmatch + 10; };
		if (sxscore1.charAt(3) == sxscore2.charAt(3)) {
			if (sxscore1.length == 4 && sxscore2.length == 4) {
				if (sxmatch != 0) { sxmatch = sxmatch + 25; };
			} else {
				if (sxmatch != 0) { sxmatch = sxmatch + 10; };
			};
		};
		if (Math.min(sxscore1.length,sxscore2.length) > 4) {
			for (n=4;n<=Math.min(sxscore1.length,sxscore2.length)-1;n++) {
				if (sxscore1.charAt(n) == sxscore2.charAt(n)) { sxmatch = sxmatch + (15/(Math.max(sxscore1.length,sxscore2.length)-4)); };
			};
		};

		// pull all the scores together
		// if they do not meet even a basic criteria, set the match to zero
		if (spedis_score < 20 || lev_score < 45) { matchscore = 0; } else {
			matchscore = (((spedis_score + lev_score)/2) - 10) + (10 * (sxmatch/100));
		};
	};
	return matchscore;
};

// When the page loads, or when the user attempts a search, this function initiates the process
// USED IN: called by HTML page elements
// LEADS TO: "initiatesearch" macro
function refresh_table() {
	// reset the text in the result table
	document.getElementById("results_table").innerHTML = "";

	// check whether anything has been typed into the search box
	if (document.pinpoint_form.search_term.value == "") {
		document.getElementById("results_table").innerHTML = "Insufficient text provided in search box.";
	} else {
		// reset all the progress bars and images to show we are starting fresh
		document.getElementById('results_table').scrollIntoView();
		updatePbar("progressbar_srch",0);
		updatePbar("progressbar_mtch",0);
		updatePbar("progressbar_oput",0);
		document.getElementById("img_mtch").src = "data/pause.gif";
		document.getElementById("img_oput").src = "data/pause.gif";
		document.getElementById("progressbarwrapper").style.display = "block";
		document.getElementById("progresstitle").innerHTML = "Please wait, searching for occupation titles:";
		document.getElementById("search_jobs").disabled = true;
		document.getElementById("search_cancel").disabled = false;
		killme = false;
	 	z = setTimeout("initiatesearch()",1);
	};
	return false;
};

// reset all the variables and scores before we start searching
// USED IN: called by "refresh_table" macro only
// LEADS TO: "clean_search_term" macro
function initiatesearch() {
	// reset all the scores
	document.getElementById("img_srch").src = "data/progress.gif";
	wholedisplaytext = "";
	displayed = 0;
	changes_to_text = "";
	for(w=0;w<socREC.length;w++) { socREC[w][0] = 0; };
	updatePbar("progressbar_srch",5);
	for (var i in job_dictionary) { job_dictionary[i] = 0; };
	updatePbar("progressbar_srch",10);
 	z = setTimeout("clean_search_term()",1);
};

// clean and correct whatever the user typed into the search box
// note we keep reference of what we have changed so we can warn the user what we have done
// USED IN: called by "initiatesearch" macro only
// LEADS TO: "dictionaryiteration" macro
function clean_search_term() {
	// replace any doubled spaces and set to lower case
	search_term = document.pinpoint_form.search_term.value.replace(/^\s\s*/,'').replace(/\s\s*$/, '').toLowerCase();
	updatePbar("progressbar_srch",15);

	// based on our database of known issues, replace any full search phrases with corrected versions
	//   eg "h g v" should be "hgv", or "part-time" should be deleted
	for (x=0;x<replacementword_full_1.length;x++) {
		before = search_term;
		search_term = search_term.replace(replacementword_full_1[x],replacementword_full_2[x]);
		if (before != search_term) {
			if (replacementword_full_2[x] == "" || replacementword_full_2[x] == " ") {
				changes_to_text = changes_to_text + ", deleted term: '" + replacementword_full_1[x] + "'";
			} else {
				changes_to_text = changes_to_text + ", replaced term: '" + replacementword_full_1[x] + "' with '" + replacementword_full_2[x] + "'";
			};
		};
	};
	updatePbar("progressbar_srch",30);
	
	// replace anything non-alpha-numeric
	search_term = search_term.replace(/[^a-z0-9' ]+/g,'');
	//'
	
	// work through each word in turn, performing the same replacement function as before but for individual words
	//   eg "it" should be "information technology", but the full search would find any occurrence of the term "it" and replace them
	search_words = search_term.split(' ');
	updatePbar("progressbar_srch",35);
	for (x=0;x<search_words.length;x++) {
		for (y=0;y<replacementword_sngl_1.length;y++) {
			if (search_words[x] == replacementword_sngl_1[y]) {
				search_words[x] = replacementword_sngl_2[y];
				if (replacementword_sngl_2[y] == "" || replacementword_sngl_2[y] == " ") {
					changes_to_text = changes_to_text + ", deleted term: '" + replacementword_sngl_1[y] + "'";
				} else {
					changes_to_text = changes_to_text + ", replaced term: '" + replacementword_sngl_1[y] + "' with '" + replacementword_sngl_2[y] + "'";
				};
			};
		};
		// if we remove any search word, make sure it is totally removed
		if (search_words[x] == "" || search_words[x] == " ") { search_words.splice(x,1); };
		updatePbar("progressbar_srch",35+(45*x/search_words.length));
	};
	
	// if the search term contains numbers, convert them to words - the dictionary is built upon words not numbers
	for (x=0;x<search_words.length;x++) {
		if (search_words[x] == 0 || search_words[x] == 1 || search_words[x] == 2 || search_words[x] == 3 || search_words[x] == 4 || search_words[x] ==  5 || search_words[x] == 6 || search_words[x] == 7 || search_words[x] == 8 || search_words[x] == 9 || search_words[x] == 10 || search_words[x] == 11 || search_words[x] ==  12 || search_words[x] == 13 || search_words[x] == 14 || search_words[x] == 15 || search_words[x] == 16 || search_words[x] == 17 || search_words[x] == 18 || search_words[x] == 19 || search_words[x] == 20) {
			changes_to_text = changes_to_text + ", replaced word: '" + search_words[x] + "' with '" + convertnumber(search_words[x]) + "'";
			search_words[x] = convertnumber(search_words[x]);
		};
	};
	
	// stitch everything back together
	search_term = search_words.join(' ');
	if (search_term.replace(/\s/g, '') == "") {
		document.getElementById("results_table").innerHTML = "<B>You searched for: <\/B><FONT COLOR=\"blue\">" + (search_term==""?"- no text -":search_term) + "</FONT>" + (changes_to_text==""?"":"<BR>(where the following changes were made: " + changes_to_text.substr(2,changes_to_text.length) + ")") + "<BR><BR>There were <B>no results</B> to display. Perhaps you could try alternative words/terms in your search.";
		updatePbar("progressbar_oput",100);
		document.getElementById("img_oput").src = "data/done.gif";
		document.getElementById("progresstitle").innerHTML = "Search complete!";
		document.getElementById("search_jobs").disabled = false;
		document.getElementById("search_cancel").disabled = true;
		document.getElementById("progressbarwrapper").style.display = "none";
	} else {
		updatePbar("progressbar_srch",100);
		document.getElementById("img_srch").src = "data/done.gif";
		document.getElementById("img_mtch").src = "data/progress.gif";
		// start the iterative matching process
		z = setTimeout("dictionaryiteration(0)",2);
	};
};

// using our dictionary of 'all individual words that appear in any SOC term'
//   apply a match score for each search term against each known word
// note this function is split to calculate for each search term in order one-by-one
// USED IN: called by "clean_search_term" macro, uses "match" function many times
// LEADS TO: "searchiteration" macro
function dictionaryiteration(myval) {
	if (killme == true) {
		cancelsearch();
	} else {
 		for (var i in job_dictionary) {
 			newscore = 0;
 			newscore = match(i,search_words[myval].replace(/[-]+/g,''));
 			// assuming this word matches the search term better than any previous ones, apply this score instead
 		 	if (newscore > job_dictionary[i]) { job_dictionary[i] = newscore; };
 		};
		updatePbar("progressbar_mtch",(50*myval/search_words.length));
 		myval = myval + 1;
 		// if there are any search terms not yet matched, move to the next one, otherwise start the next process
 		if (myval >= search_words.length) {
			z = setTimeout("searchiteration(0)",1);
 		} else {
 			z = setTimeout("dictionaryiteration(" + myval + ")",2);
 		};
	};
};

// iterate through the SOC code database and apply an appropriate score to each term
// this uses the scores we applied to the dictionary in the previous macro
// note this function is split to calculate for each 60 SOC codes in turn
// USED IN: called by "dictionaryiteration" macro only
// LEADS TO: "sortscores" macro, and calls "score_this_term" function
function searchiteration(myval) {
	if (killme == true) {
		cancelsearch();
	} else {
		if ((myval + 50) >= socREC.length) { topval = socREC.length; } else { topval = myval + 51; };
		for(w=myval;w<topval;w++) { socREC[w][0] = score_this_term(w); };
		myval = myval + 50;
		updatePbar("progressbar_mtch",50+(50*w/socREC.length));
		if (myval >= socREC.length) { z = setTimeout("sortscores()",2); } else { z = setTimeout("searchiteration(" + myval + ")",1); };
	};
};

// Add together the scores for each word in the job title, then standardise for the number of words
// USED IN: "searchiteration" macro only
// LEADS TO: self-contained function
function score_this_term(w) {
	totalscore = 0;
	// note that while we allow words to contain hyphens, the job dictionary array cannot handle them
	for(y=3;y<socREC[w].length;y++) { totalscore = totalscore + job_dictionary[socREC[w][y].replace(/[-]+/g,'')]; };
	return (totalscore / (socREC[w].length - 3));
};

// Sort the scores of each SOC code into descending order in advance of displaying them
// USED IN: called by "searchiteration" macro only
// LEADS TO: "displayrecords" macro
function sortscores() {
	document.getElementById("img_mtch").src = "data/done.gif";
	document.getElementById("img_oput").src = "data/progress.gif";
	scoreranking = new Array(); x = 0; for(w=0;w<socREC.length;w++) {
		if (isNumeric(socREC[w][0]) && socREC[w][0] > 40) {
//scoreranking[x++] = Math.round(socREC[w][0]*1000) / 1000;
// adjusted score = socREC[w][0]
// raw score = Math.round(socREC[w][0] * (socREC[w].length - 3))

	rawscore = 0;
	rawscore = Math.round(socREC[w][0] * (socREC[w].length - 3));
	temprawscore = rawscore.toString();
	do { temprawscore = "0" + temprawscore; } while (temprawscore.length<9);
	tempadjscore = 0;
	tempadjscore = Math.round(socREC[w][0]*1000);
	tempfinalscore = tempadjscore + temprawscore;
	scoreranking[x++] = (tempfinalscore*1);
};
	};
	updatePbar("progressbar_oput",5);
	rankedscores = new Array(); rankedscores = scoreranking.sort(function(a,b){return (b-a)});
	updatePbar("progressbar_oput",20);
	w=1; do {
		if (rankedscores[w] == rankedscores[w-1]) { rankedscores.splice(w,1); } else { w++; };
	} while (w<rankedscores.length);
	updatePbar("progressbar_oput",35);
	z = setTimeout("displayrecords(0,"+defaultnorecords+")",1);
};

// prepare the top x-number of scored terms for displaying to the user
// USED IN: called by "sortscores" macro only
// LEADS TO: "finishoff" macro
function displayrecords(w,norecs) {
	if (killme == true) {
		cancelsearch();
	} else {
		if (w<rankedscores.length && displayed < norecs) {
			for (x=0;x<socREC.length;x++) {
			// fix to force the sorting by adjusted score then raw score
			rawscore = 0;
			rawscore = Math.round(socREC[x][0] * (socREC[x].length - 3));
			temprawscore = rawscore.toString();
			do { temprawscore = "0" + temprawscore; } while (temprawscore.length<9);
			tempadjscore = 0;
			tempadjscore = Math.round(socREC[x][0]*1000);
			tempfinalscore = tempadjscore + temprawscore;
			// end of fix
			if (rankedscores[w] == (tempfinalscore*1) && rankedscores[w] != 0 && displayed < norecs) {
				if (socREC[x][2].substr(0,3)=="SE:") {
					wholedisplaytext = wholedisplaytext + "<BR><SPAN CLASS=\"soc-class\" onmouseover=\"this.style.backgroundColor='#D7E866';\" onmouseout=\"this.style.backgroundColor='transparent';\" onclick=\"z = window.open('data/SeeAlso.html','_blank','channelmode=no,directories=no,fullscreen=no,height=500,left=50,location=no,menubar=no,resizable=yes,scrollbars=yes,status=yes,titlebar=no,toolbar=no,top=50,width=700',false);\">for &#8220;" + socREC[x][1].replace(/\s\s*$/, '') + "&#8221; " + socREC[x][2].substr(3,socREC[x][2].length-3) + "</SPAN> ";
				} else {
					wholedisplaytext = wholedisplaytext + "<BR><SPAN CLASS=\"soc-class\" onmouseover=\"this.style.backgroundColor='#D7E866';\" onmouseout=\"this.style.backgroundColor='transparent';\" onclick=\"openinfo(0," + socREC[x][2] + ");\">" + socREC[x][2] + ", &#8220;" + socREC[x][1].replace(/\s\s*$/, '') + "&#8221;</SPAN> ";
				};
					displayed++;
				};
			};
			w++;
			updatePbar("progressbar_oput",35+(60 * Math.max((w/rankedscores.length),(displayed/norecs))));
			z = setTimeout("displayrecords(" + w + ","+norecs+")",1);
		} else { finishoff(norecs); };
	};
};

// the final stage - actually displaying the results of what we found to the user
// USED IN: called by "displayrecords" macro only
// LEADS TO: nothing
function finishoff(norecs) {
	if (displayed == 0) {
		document.getElementById("results_table").innerHTML = "<B>You searched for: <\/B><FONT COLOR=\"blue\">" + (search_term==""?"- no text -":search_term) + "</FONT>" + (changes_to_text==""?"":"<BR>(where the following changes were made: " + changes_to_text.substr(2,changes_to_text.length) + ")") + "<BR><BR>There were <B>no results</B> to display. Perhaps you could try alternative words/terms in your search.";
	} else {
		document.getElementById("results_table").innerHTML = "<B>You searched for: <\/B><FONT COLOR=\"blue\">" + (search_term==""?"- no text -":search_term) + "</FONT>" + (changes_to_text==""?"":"<BR>(where the following changes were made: " + changes_to_text.substr(2,changes_to_text.length) + ")") + "<BR><BR>The <B>results of your search<\/B> are listed below, and are presented in reverse word order with the most likely matches first. You can click on the links for further information, and to discover your related NS-SEC code." + wholedisplaytext + (displayed==norecs?"<BR><BR><FONT COLOR=\"darkgreen\"><B>Your search returned more than "+norecs+" results. To display the next "+defaultnorecords+" results, <INPUT ID=\"display_more\" TYPE=\"BUTTON\" CLASS=\"SOCbutton\" VALUE=\"click this button\" onclick=\"showmoreresults("+norecs+");\" /> or try refining your search term.<\/B><\/FONT>":"") + "<BR><BR>For further information about coding, please refer to the <A HREF=\"http://www.ons.gov.uk/ons/guide-method/classifications/current-standard-classifications/soc2010/soc2010-volume-2-the-structure-and-index/index.html\" TARGET=\"_blank\" TITLE=\"Link to the SOC 2010 Volume 2 coding index\">SOC 2010 Volume 2 coding index</A>.<BR>";
	};
	updatePbar("progressbar_oput",100);
	document.getElementById("img_oput").src = "data/done.gif";
	document.getElementById("progresstitle").innerHTML = "Search complete!";
	document.getElementById("search_jobs").disabled = false;
	document.getElementById("search_cancel").disabled = true;
	document.getElementById("progressbarwrapper").style.display = "none";
};

function showmoreresults(norecs) {

	document.getElementById("results_table").innerHTML = "";
	document.getElementById('results_table').scrollIntoView();
	wholedisplaytext = "";
	displayed = 0;
	updatePbar("progressbar_oput",0);
	document.getElementById("img_oput").src = "data/progress.gif";
	document.getElementById("progresstitle").innerHTML = "Appending more records to results...";
	document.getElementById("progressbarwrapper").style.display = "block";

	z = setTimeout("displayrecords(0,"+(norecs+defaultnorecords)+")",1);
};

// if the user clicked cancel, set the progress sections to show a warning and stop processing
// USED IN: most processing macros
// LEADS TO: nothing
function cancelsearch() {
	document.getElementById("search_jobs").disabled = false;
	document.getElementById("search_cancel").disabled = true;
	document.getElementById("img_srch").src = "data/warning.gif";
	document.getElementById("img_mtch").src = "data/warning.gif";
	document.getElementById("img_oput").src = "data/warning.gif";
	document.getElementById("progresstitle").innerHTML = "Search cancelled!";
	killme = false;
	clearTimeout(z);
};

// convert a known number to its word equivalent
function convertnumber(mynum) { return numTOtext[mynum]; };

// check whether a value is numeric or not
function isNumeric(x) { return !isNaN(parseFloat(x)) && isFinite(x); };

// update the progress bar using JQuery
function updatePbar(pbtgt,pbval) {
	$(function() {
		$( "#"+pbtgt ).progressbar({
			value: pbval
		 });
	});
};

// if the user clicked on a link to show more information about a code, open said pop-up window
function openinfo(n,myvar) {
	z = window.open((n==0?"data/":"") + "SingleClass.html?soc="+myvar,"_blank","channelmode=no,directories=no,fullscreen=no,height="+(myvar>999?500:350)+",left=50,location=no,menubar=no,resizable=yes,scrollbars=yes,status=yes,titlebar=no,toolbar=no,top=50,width=700",false);
};

// if the user typed in a SOC code they think they know, check it exists, then open a pop-up for it
function showknownterm() {
	start_term = document.pinpoint_form.known_term.value.replace(/(\r\n|\n|\r)/gm,"").replace(/(\t)/gm,"");
	if (start_term.charAt(0) == "0") {
		do { start_term = start_term.substr(1,start_term.length-1); } while (start_term.charAt(0) == "0");
	};
	specificcode = start_term.replace(/[^0-9]+/g,'');
	if (start_term == specificcode && specificcode > 0 && specificcode < 10000) {
		if (!socDB[specificcode]) {
			alert("The code you entered was not recognised by the database. Perhaps you typed a digit incorrectly. Please try again.");
		} else {
			openinfo(0,specificcode);
		};
	} else {
		alert("The SOC code you entered is not a value code - it should be a numeric code of upto four digits - please try again");
	};
};

// if some sort of descriptive text contains a SOC code, convert that code into a clickable link
function replace_refs(tempvar) {
	endvar = tempvar;
	do {
		z = tempvar.search(/[0-9]/);
		if (z != -1) {
			if (isNumeric(tempvar.substr(z,1)) && isNumeric(tempvar.substr(z+1,1)) && isNumeric(tempvar.substr(z+2,1)) && isNumeric(tempvar.substr(z+3,1))) {
				wheretoinsert = endvar.indexOf(tempvar.substr(z,4));
				endvar = endvar.substr(0,wheretoinsert) + "<SPAN CLASS=\"soc-class\" onclick=\"openinfo(1," + tempvar.substr(z,4) + ");\">" + tempvar.substr(z,4) + "</SPAN>" + endvar.substr(wheretoinsert+4,endvar.length - (wheretoinsert+4));
			};
			tempvar = tempvar.substr(z+1,tempvar.length - z);
		};
	} while (tempvar.search(/[0-9]/) != -1);
	return endvar;
};