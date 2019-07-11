// const apiKeyYt = "AIzaSyDHaIMUkv2DdX8RqP0rmf8QIhcCg_5KU08"; API 1 over quota limit
const apiKeyYt = "AIzaSyCw7Gw6BDPrcRiqjfTMfDckh_11BKWl7HM"
const ytCLIENT_ID = "254484771306-7r6u8p6efbpqcjru9diqqnq4naoval1o.apps.googleusercontent.com";
const ytDISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/youtube/v3/rest'];
const ytSCOPES = 'https://www.googleapis.com/auth/youtube.readonly  https://www.googleapis.com/auth/youtube.force-ssl';

const authorizeButton = document.getElementById('authorize-button');
const signoutButton = document.getElementById('signout-button');
const content = document.getElementById('content');
const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const videoContainer = document.getElementById('video-container');
const searchTerm = document.querySelector('search-input');


// 2. This code loads the IFrame Player API code asynchronously.
var tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);


// Form submit 
searchForm.addEventListener('submit', e => {
    e.preventDefault();
    makeRequest();
});
function onPlayerClick(){
        event.target.playVideo();
}
// Load auth2 library
function handleClientLoad() {
    gapi.load('client:auth2', initClient);
}

// Init API client
function initClient() {
    gapi.client
        .init({
            discoveryDocs: ytDISCOVERY_DOCS,
            clientId: ytCLIENT_ID,
            scope: ytSCOPES
        })
        .then(() => {
            gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);
            updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
            authorizeButton.onclick = handleAuthClick;
            signoutButton.onclick = handleSignoutClick;
        });
}

// Hide and unhide elements based on login state
function updateSigninStatus(isSignedIn) {
    if (isSignedIn) {
        authorizeButton.style.display = 'none';
        signoutButton.style.display = 'block';
        content.style.display = 'block';
        videoContainer.style.display = 'block';
    } else {
        authorizeButton.style.display = 'block';
        signoutButton.style.display = 'none';
        content.style.display = 'none';
        videoContainer.style.display = 'none';
    }
}

// Login and Logout
function handleAuthClick() {
    gapi.auth2.getAuthInstance().signIn();
}

function handleSignoutClick() {
    gapi.auth2.getAuthInstance().signOut();
}

function searchList() {
    gapi.client.setApiKey(apiKeyYt); 
    gapi.client.load('youtube', 'v3', function() {
        makeRequest();
    });
}

// 3. This function creates an <iframe> (and YouTube player)
//    after the API code downloads.
function createYouTubePlayer(videoid,divid) {
    // console.log('divid'+divid);
    playDiv = new YT.Player(divid, {
        height: '80',
        width: '100',
        videoId: videoid,
        events: {
            'onClick':onPlayerClick, 
        }
    });
}


// 
function makeRequest(token) {
    var q = $('#search-input').val().toLowerCase();
    
    // make API Search:list request using google api library
    var searchRequest = gapi.client.youtube.search.list({
        q: q,
        part: 'snippet', 
        type: 'video',
        maxResults: 5,
        pageToken: token // undefined by default
    })

    searchRequest.execute(function(response)  {                                                                                    
            $('#video-container').empty()
            var srchItems = response.result.items; 
            
            // Global variables
            window.nextPageToken = response.nextPageToken;
            window.prevPageToken = response.prevPageToken;
            
            var $videoContainer = $('#video-container')
            
            if(token) {
                $videoContainer.html("");
            }

            // toggleClass accepts 2 arguments (1st is required, 2nd one is optional)
            // if you specify a 2nd argument, the class would be added or removed depending on the boolean
            $("#prev").toggleClass("hide", !window.prevPageToken)
            $("#next").toggleClass("hide", !window.nextPageToken)
            
            let counter=0;

            $.each(srchItems, function(index, item) {
                var videoTitle = item.snippet.title;  
                var videoId = item.id.videoId;
                var videoImg = item.snippet.thumbnails.default.url;  
                
                // make API Videos:list request in order to get duration
                var detailsRequest = gapi.client.youtube.videos.list({
                    id: videoId,
                    part: 'contentDetails', 
                    type: 'video',
                    maxResults: 5
                })

                detailsRequest.execute(function(details) {
                    var videoDuration = ISO8601toDuration(details.items[0].contentDetails.duration);

                    // Check index of returned YT ISO8601 time format and trim
                    function formatTimeUnit(input, unit) {
                        var index = input.indexOf(unit);
                        var output = "00"
                        if (index < 0) {
                            return output; 
                        }
                        if (isNaN(input.charAt(index-2))) {
                            return '0' + input.charAt(index-1);
                        } else {
                            return input.charAt(index-2) + input.charAt(index-1);
                        }
                    }

                    // Convert ISO8601 format to time HH:MM:SS
                    function ISO8601toDuration(input){
                        var H = formatTimeUnit(input, 'H');
                        var M = formatTimeUnit(input, 'M');
                        var S = formatTimeUnit(input, 'S');
                        if (H == "00") {
                            H = "";
                        } else {
                            H += ":"
                        }
                    
                        return H  + M + ':' + S ;
                    }
                    
                    // Call function to create youtube player
                    createPlayer("divP"+counter,videoId,videoImg);
                    counter++;
                    
                })
            })
    })
}

// function to create youtube player
function createPlayer(divid,videoId,videoImg) {
    var $videoContainer = $('#video-container');
            
    //if(token) {
    //  $videoContainer.html("");
    // }
    // console.log('divid inside createplayer'+divid);
    $videoContainer.append(`
    <div class="container" id="${divid}">

        ${videoId}
        <img src="${videoImg}"/>
    </div>`);    
    createYouTubePlayer(videoId,divid);    
}


// function to show all liked videos from the user's account / channel
function getLikedVideos() {
    $('#video-container').empty();
    let counter = 0;
    return gapi.client.youtube.videos.list({
        "part": "snippet,contentDetails",
        "myRating": "like"
    }).then(function(response) {
        let items = response.result.items;
        $.each(items,function(index,item) {
            // console.log(item);
            createPlayer("divLiked"+counter,item.id,item.videoImg);
            counter++;
        });
            },
            function(err) { 
                console.error("Execute error", err);
                });
}


function getNext () {
    makeRequest(window.nextPageToken);
}

function getPrev () {
    makeRequest(window.prevPageToken);
}

document.getElementById("next").addEventListener("click", getNext)
document.getElementById("prev").addEventListener("click", getPrev)


