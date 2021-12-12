import { NPC, Dialog, TrackUserFlag } from '@dcl/npc-scene-utils'
//import { script } from 'script'
// https://bafybeiehmsgzo7khxwa5cslo7bqihpzjbpgr4r426pb2gmnibqt2ncqvkm.ipfs.dweb.link/script_golfcraft.json

const canvas = new UICanvas()

const textInput = new UIInputText(canvas)
textInput.width = "80%"
textInput.height = "25px"
textInput.vAlign = "bottom"
textInput.hAlign = "center"
textInput.fontSize = 10
textInput.placeholder = "Write message here"
//textInput.placeholderColor = Color4.Gray()
textInput.positionY = "200px"
textInput.isPointerBlocker = true
textInput.visible = false
textInput.onTextSubmit = new OnTextSubmit((x) => {
    setJson(x.text.trim())
})

function setJson(json_url: string) {
    executeTask(async () => {
        textInput.visible = false
        try {
            let response = await fetch(json_url)
            let json = await response.json()
            log(json)
            loadScript(json)
        } catch {
            log("failed to reach URL")
        }
    })
}

const cube = new Entity()
cube.addComponent(new BoxShape())
cube.addComponent(new Transform({
    position: new Vector3(10, 2, -10),
}))
cube.addComponent(
    new OnPointerDown((e) => {
        textInput.visible = true
    })
)
engine.addEntity(cube)

const initial_positions = {
    npc_a: {
        position: new Vector3(10, 1.5, 8)
    },
    npc: {
        position: new Vector3(10, 1.5, 10)
    }
}

let myNPC_A = new NPC(initial_positions["npc_a"], 'models/bela.glb', initiateTalk, {
        faceUser: true,
        idleAnim: `Idle`,
        onlyClickTrigger: true,
        onWalkAway: endTalk
    }
)
myNPC_A.getComponent(TrackUserFlag).active = true

const nt = new Transform({
    position: new Vector3(0, 0.7, 0),
    rotation: Quaternion.Euler(0, 180, 0),
    scale: new Vector3(0.35, 0.35, 0.35)
})

const myNPC_A_Name = new Entity()
myNPC_A_Name.addComponent(new TextShape("Mickey"))
myNPC_A_Name.addComponent(nt)
myNPC_A_Name.setParent(myNPC_A)

let myNPC = new NPC(initial_positions["npc"], 'models/alice.glb', initiateTalk,
    {
        faceUser: true,
        idleAnim: `Idle`,
        onlyClickTrigger: true,
        onWalkAway: endTalk
    }
)
myNPC.getComponent(TrackUserFlag).active = true

const myNPC_Name = new Entity()
myNPC_Name.addComponent(new TextShape("Arnold"))
myNPC_Name.addComponent(nt)
myNPC_Name.setParent(myNPC)

let ILoveCats: Dialog[] = []

function initiateTalk() {
    // Disable activations
    myNPC_A.onActivate = () => {}
    myNPC.onActivate = () => {}

    myNPC_A.getComponent(TrackUserFlag).active = true
    myNPC.getComponent(TrackUserFlag).active = true
    myNPC.talk(ILoveCats, 0)
    myNPC.playAnimation(`Hello`)
}

function endTalk() {
    // Enable activations
    myNPC_A.onActivate = initiateTalk
    myNPC.onActivate = initiateTalk

    myNPC_A.playAnimation(`Idle`)
    myNPC.playAnimation(`Idle`)

    gotoPlace("start")
}

const characters: any = {
    Matthew: {
        name: "Arnold",
        npc: myNPC
    },
    Joanna: {
        name: "Mickey",
        npc: myNPC_A
    },
    Brian: {
        name: "Scamjack",
        npc: myNPC
    }
}


// Idle, Talk, Hello, Goodbye
function loadScript(script: any) {
    ILoveCats = []
    for (let n=0; n < script.episodes[0].story.length; n++) {
        const character_id = script.episodes[0].story[n].voice.split(",")[1]
        const character_name = characters[character_id].name
        //const character_other_npc = characters[characters[character_id].other].npc

        if (script.episodes[0].story[n].type == "story") {
            const data = getDataFrom(script, script.episodes[0].story[n].id, 0)
            ILoveCats.push({
                text: character_name + ": " + data.text,
                name: script.episodes[0].story[n].id,
                triggeredByNext: () => {
                    myNPC.playAnimation(`Idle`)
                    myNPC_A.playAnimation(`Idle`)

                    if (n+1 <  script.episodes[0].story.length) {
                        const data_next = getDataFrom(script, script.episodes[0].story[n+1].id, 0)
                        executeActions(data_next)
                    }
                }
            })
        } else if (script.episodes[0].story[n].type == "simple") {
            const id_yes = script.episodes[0].story[n].id+"yes"
            const id_no = script.episodes[0].story[n].id+"no"
            const data = getDataFrom(script, script.episodes[0].story[n].id, 0)
            let data_next: any
            if (n+1 <  script.episodes[0].story.length) {
                data_next = getDataFrom(script, script.episodes[0].story[n+1].id, 0)
            } else{
                data_next = data
            }

            // Question
            ILoveCats.push({
                text: character_name + ": " + data.text,
                name: script.episodes[0].story[n].id,
                isQuestion: true,
                buttons: [
                    { label: `Yes`, goToDialog: id_yes },
                    { label: `No`, goToDialog: id_no }
                ]
            })
            // Answer yes
            const data_yes = getDataFrom(script, script.episodes[0].story[n].id, 1)
            ILoveCats.push({
                text: character_name + ": " + data_yes.text,
                name: id_yes,
                triggeredByNext: () => {
                    myNPC.talk(ILoveCats, id_no)
                    myNPC.playAnimation(`Idle`)
                    myNPC_A.playAnimation(`Idle`)
                    data_next.npc.playAnimation(`Talk`)
                    executeActions(data_next)
                }
            })
            // Answer no
            const data_no = getDataFrom(script, script.episodes[0].story[n].id, 2)
            ILoveCats.push({
                text: character_name + ": " + data_no.text,
                name: id_no,
                triggeredByNext: () => {
                    myNPC.talk(ILoveCats, id_no)
                    myNPC.playAnimation(`Idle`)
                    myNPC_A.playAnimation(`Idle`)
                    data_next.npc.playAnimation(`Talk`)
                    executeActions(data_next)
                }
            })
        }
    }
    ILoveCats[ILoveCats.length-1].isEndOfDialog = true
}

function executeActions(data: any) {
    if (data.action == "raise_golfclub") {
        data.npc.playAnimation(`Hello`)
    } else {
        data.npc.playAnimation(`Talk`)
    }
    if (data.action == "goto_training_leaderboard") {
        gotoPlace("training_leaderboard")
    } else if (data.action == "goto_training_board") {
        gotoPlace("training_board")
    } else if (data.action == "goto_level_board") {
        gotoPlace("level_board")
    }
}

function gotoPlace(place: string) {
    const npc_position = myNPC.getComponent(Transform).position
    const npc_a_position = myNPC_A.getComponent(Transform).position

    const paths: any = {
        start: {
            npc_a: [npc_a_position, initial_positions.npc_a.position],
            npc: [npc_position, initial_positions.npc.position]
        },
        training_leaderboard: {
            npc_a: [npc_a_position, new Vector3(7, 1.5, 2)],
            npc: [npc_position, new Vector3(6, 1.5, 2)]
        },
        training_board: {
            npc_a: [npc_a_position, new Vector3(3, 1.5, 4)],
            npc: [npc_position, new Vector3(2, 1.5, 4)]
        },
        level_board: {
            npc_a: [npc_a_position, new Vector3(3, 1.5, 2)],
            npc: [npc_position, new Vector3(2.5, 1.5, 2)]
        },
    }

    log(place)
    log(paths[place].npc)
    log(paths[place].npc_a)

    myNPC.followPath({
        path: paths[place].npc,
        totalDuration: 4,
        loop: false,
        curve: true,
        startingPoint: 0,
        onFinishCallback: () => {
            myNPC.getComponent(TrackUserFlag).active = true
        }
    })
    myNPC_A.followPath({
        path: paths[place].npc_a,
        totalDuration: 4,
        loop: false,
        curve: true,
        startingPoint: 0,
        onFinishCallback: () => {
            myNPC_A.getComponent(TrackUserFlag).active = true
        }
    })
}

function getDataFrom(script: any, id: string, cid: number = 0) {
    let data =  {
        npc: myNPC,
        action: "",
        text: ""
    }
    for (let n=0; n < script.episodes[0].story.length; n++) {
        if (script.episodes[0].story[n].id == id) {

            let text = ""+script.episodes[0].story[n].content[cid]
            const original_text = ""+text
            text = text.replace(/\\raise_golfclub/g, "")
            text = text.replace(/\\goto_training_leaderboard/g, "")
            text = text.replace(/\\goto_training_board/g, "")
            text = text.replace(/\\goto_level_board/g, "")

            if (original_text.indexOf('\\raise_golfclub') !== -1) {
                data.action = "raise_golfclub"
            } else if (original_text.indexOf('\\goto_training_leaderboard') !== -1) {
                data.action = "goto_training_leaderboard"
            } else if (original_text.indexOf('\\goto_training_board') !== -1) {
                data.action = "goto_training_board"
            } else if (original_text.indexOf('\\goto_level_board') !== -1) {
                data.action = "goto_level_board"
            }

            const character_id = script.episodes[0].story[n].voice.split(",")[1]
            data.npc =  characters[character_id].npc
            data.text = text

            break
        }
    }
    return data
}

setJson("https://bafybeifsqoyxeuzsoekfv6brgm6iudy7mrqt7eyhvymj4wzjrlvb6wxcue.ipfs.dweb.link/script_golfcraft.json")
