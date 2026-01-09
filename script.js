let current_song = new Audio
current_song.preload = "metadata";
let songs;
let current_folder;
let item;

function convert_time(time) {
    if (isNaN(time)) {
        return "00:00"
    }
    let min = Math.floor(time / 60).toString().padStart(2, "0")
    let sec = Math.floor(time % 60).toString().padStart(2, "0")
    let time_convert = min + ":" + sec
    return time_convert
}

function resetSeekbar() {
    if (convert_time(current_song.currentTime) == "00:00") {
        document.querySelector(".circle").style.left = "-1px"
        play.src = "Assets/pause.svg"
    }
}

async function get_song(folder) {
    current_folder = folder
    let a = await fetch(`./${folder}/`)
    let response = await a.text()
    let div = document.createElement("div")
    div.innerHTML = response
    let as = div.getElementsByTagName("a")
    let songs = []
    for (let index = 0; index < as.length; index++) {
        const element = as[index];
        if (element.href.endsWith(".mp3")) {
            songs.push(element.href.split("http://127.0.0.1:3000/")[1].replaceAll("%20", " ").replaceAll("%5C", "/").split(`${current_folder}`)[1].replace("/", "").replace(".mp3", ""))
        }
    }

    // Show all the songs in the playlist
    let songUl = document.querySelector(".music_list").getElementsByTagName("ul")[0]
    songUl.innerHTML = ""
    for (const song of songs) {
        songUl.innerHTML += `<li class="flex rounded">
        <img src="Assets/music.svg" alt="music" height="20px">
        <div class="song">${song.replaceAll("%20", " ").replace(".mp3", "")}</div>
        <img class="play_song invert" src="Assets/playsong.svg" alt="play" height="20px"></li>`
    }

    // Attach an event listener to every song
    Array.from(document.querySelector(".music_list").getElementsByTagName("li")).forEach(e => {
        e.addEventListener("click", element => {
            play_song(e.querySelector(".song").innerHTML)
        })
    })

    return songs
}

// Creating an album
async function display_Albums() {
    let folder;
    let a = await fetch(`http://127.0.0.1:3000/Songs/`)
    let response = await a.text()
    let div = document.createElement("div")
    div.innerHTML = response
    let anchors = div.getElementsByTagName("a")
    let array = Array.from(anchors)
    for (let index = 1; index < array.length; index++) {
        const element = array[index];
        if (element.href.includes("Songs") == true) {
            folder = element.href.split("http://127.0.0.1:3000/%5CSongs%5C")[1].replace("/", "")
        }
        // Get the metadata of the folder
        let a = await fetch(`http://127.0.0.1:3000/Songs/${folder}/info.json`)
        let response = await a.json()
        document.querySelector(".cards-container").innerHTML += `<div data-folder= ${folder} class="cards flexc">
                        <img src="Songs/${folder}/cover.png" alt="card" class="card-img">
                        <img src="Assets/play.png" alt="play" class="play">
                        <h3>${response.title}</h3>
                        <p>${response.description}</p>
                    </div>`
    }

    // Load the playlist when a card is clicked
    let arr = Array.from(document.getElementsByClassName("cards"))
    arr.forEach(element => {
        element.addEventListener("click", async (item) => {
            if (element.classList.contains("play")) {
                return
            }
            songs = await get_song(`Songs/${item.currentTarget.dataset.folder}`)
            document.querySelector(".songName").innerHTML = songs[0]
            if (document.querySelector(".songName").innerHTML == "undefined") {
                document.querySelector(".songName").innerHTML = ""
                play.src = "Assets/playsong.svg"
            }

            // Loads first song
            current_song.src = `/${current_folder}/` + songs[0] + ".mp3"
            current_song.load(); // preload metadata
            resetSeekbar()
            play.src = "Assets/playsong.svg"
            document.querySelector(".songName").innerHTML =
                decodeURI(songs[0].replace(".mp3", ""))
        })
    })

    // Plays the first song when playbutton of card is clicked
    Array.from(document.getElementsByClassName("cards")).forEach(element => {
        element.querySelector(".play").addEventListener("click", async (e) => {
            e.stopPropagation()
            songs = await get_song(`Songs/${element.dataset.folder}`)
            play_song(songs[0])
        })
    })
}

// Playing a song when clicked
const play_song = (track) => {
    current_song.src = `/${current_folder}/` + track + ".mp3"
    current_song.play()
    play.src = "Assets/pause.svg"
    document.querySelector(".songName").innerHTML = decodeURI(track)
    document.querySelector(".duration").innerHTML = "00:00 / 00:00"
}

async function main() {
    // Gets the list of songs
    songs = await get_song("Songs/vintagevibes")

    // Displays all the albums
    display_Albums()

    // Preloads first song
    current_song.src = `/${current_folder}/` + songs[0] + ".mp3"
    current_song.load(); // preload metadata
    document.querySelector(".songName").innerHTML =
        decodeURI(songs[0].replace(".mp3", ""))

    // Loads the duration of first song by default  
    current_song.addEventListener("loadedmetadata", () => {
        document.querySelector(".duration").innerHTML =
            `00:00 / ${convert_time(current_song.duration)}`
    })

    // Attach an event listener to previous, play and next song
    play.addEventListener("click", () => {
        if (current_song.paused) {
            current_song.play()
            play.src = "Assets/pause.svg"
        }
        else {
            current_song.pause()
            play.src = "Assets/playsong.svg"
        }
    })

    // Event listener for time update
    current_song.addEventListener("timeupdate", () => {
        document.querySelector(".duration").innerHTML = `${convert_time(current_song.currentTime)} / ${convert_time(current_song.duration)}`
        document.querySelector(".circle").style.left = (current_song.currentTime / current_song.duration) * 100 + "%"
    })

    // Add event listener to seekbar
    document.querySelector(".seekbar").addEventListener("click", (e) => {
        let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100
        document.querySelector(".circle").style.left = percent + "%"
        current_song.currentTime = (current_song.duration) * percent / 100
    })

    // Add event listener to hamburger
    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-10px"
    })

    // Add event listener to cross
    document.querySelector(".cross").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-100%"
    })

    // Add event listener to show all
    document.querySelector(".m2").addEventListener("click", () => {
        document.querySelector(".cards-container").style.maxHeight = "100%"
        document.querySelector(".music_list").style.display = "none"
        document.querySelector(".playbar").style.display = "none"
        document.querySelector(".m2").style.display = "none"
        document.querySelector(".m3").style.display = "block"
        document.querySelector("body").style.overflowY = "auto"
        document.querySelector(".right").style.height = "100vh"
        document.querySelector(".playlist").style.height = "69vh"

    })

    // Add event listener to show less
    document.querySelector(".m3").addEventListener("click", () => {
        document.querySelector(".cards-container").style.maxHeight = "40vh"
        document.querySelector(".music_list").style.display = "block"
        document.querySelector(".playbar").style.display = "block"
        document.querySelector(".m2").style.display = "block"
        document.querySelector(".m3").style.display = "none"
        document.querySelector("body").style.overflowY = "hidden"
        document.querySelector(".right").style.height = "93vh"
        document.querySelector(".playlist").style.height = "62.5vh"
    })

    // Add an event listener to previous
    previous.addEventListener("click", () => {
        let index = songs.indexOf(current_song.src.split(`http://127.0.0.1:3000/${current_folder}/`)[1].replaceAll("%20", " ").replace(".mp3", ""))
        if ((index - 1) >= 0) {
            play_song(songs[index - 1])
        }
    })

    // Add an event listener to next
    next.addEventListener("click", () => {
        let index = songs.indexOf(current_song.src.split(`http://127.0.0.1:3000/${current_folder}/`)[1].replaceAll("%20", " ").replace(".mp3", ""))
        if ((index + 1) < songs.length) {
            play_song(songs[index + 1])
        }
    })

    // Add an event listener to volume
    document.querySelector(".volumeseek").addEventListener("mouseover", () => {
        document.querySelector(".playbuttons input").style.display = "block"
    })

    document.querySelector(".volumeseek").addEventListener("mouseleave", () => {
        document.querySelector(".playbuttons input").style.display = "none"
    })

    document.querySelector(".volumeseek").getElementsByTagName("input")[0].addEventListener("change", (e) => {
        current_song.volume = parseInt(e.target.value) / 100
        if (current_song.volume == 0) {
            volume.src = "Assets/mute.svg"
        }
        else if (current_song.volume < 0.5) {
            volume.src = "Assets/volume_level.svg"
        }
        else {
            volume.src = "Assets/volume.svg"
        }
    })

    // Add event listener to mute the song
    volume.addEventListener("click", (e) => {
        if (e.target.src.includes("Assets/volume.svg") || e.target.src.includes("Assets/volume_level.svg")) {
            e.target.src = e.target.src.replace("Assets/volume.svg", "Assets/mute.svg")
            e.target.src = e.target.src.replace("Assets/volume_level.svg", "Assets/mute.svg")
            current_song.volume = 0
            setVolume.value = 0
        }
        else {
            e.target.src = e.target.src.replace("Assets/mute.svg", "Assets/volume_level.svg")
            current_song.volume = 0.25
            setVolume.value = 25
        }
    })

}
main()