// const apiKeyYt = "AIzaSyDHaIMUkv2DdX8RqP0rmf8QIhcCg_5KU08"; API 1 over quota limit
const apiKeyYt = "AIzaSyCw7Gw6BDPrcRiqjfTMfDckh_11BKWl7HM"
const ytCLIENT_ID = "254484771306-7r6u8p6efbpqcjru9diqqnq4naoval1o.apps.googleusercontent.com";
const ytDISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/youtube/v3/rest'];
const ytSCOPES = 'https://www.googleapis.com/auth/youtube.readonly';

const authorizeButton = document.getElementById('authorize-button');
const signoutButton = document.getElementById('signout-button');
const content = document.getElementById('content');
const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const videoContainer = document.getElementById('video-container');
const searchTerm = document.querySelector('search-input');


// Form submit 
searchForm.addEventListener('submit', e => {
e.preventDefault();

    let search = searchInput.value;
    makeRequest();
});

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


// localhost:8888
function searchList(){
    gapi.client.setApiKey(apiKeyYt); 
    gapi.client.load('youtube', 'v3', function() {
        makeRequest();
    });
}

function makeRequest(token) {
    var q = $('#search-input').val().toLowerCase();
    
    // make API search request
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
            
            $.each(srchItems, function(index, item) {
                var vidTitle = item.snippet.title;  
                var videoId = item.id.videoId;
                var videoImg = item.snippet.thumbnails.default.url;  
                
                // make API video request in order to get duration
                var detailsRequest = gapi.client.youtube.videos.list({
                    id: videoId,
                    part: 'contentDetails', 
                    type: 'video',
                    maxResults: 5
                })

                detailsRequest.execute(function(details) {
                    var videoDuration = details.items[0].contentDetails.duration;

                    $videoContainer.append(`
                        <div class="container">
                            <img src="${videoImg}"/>
                            ${vidTitle}
                            ${videoDuration}
                            <button src="https://www.youtube.com/watch?v=${videoId}">Add</button>
                            ${videoId}
                        </div>`);    
                })
            })
    })
}

function getNext () {
    makeRequest(window.nextPageToken);
}

function getPrev () {
    makeRequest(window.prevPageToken);
}

document.getElementById("next").addEventListener("click", getNext)
document.getElementById("prev").addEventListener("click", getPrev)
