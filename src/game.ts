import { NPC, Dialog } from '@dcl/npc-scene-utils'
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
    executeTask(async () => {
        textInput.visible = false
        try {
            let response = await fetch(x.text.trim())
            let json = await response.json()
            log(json)
            loadScript(json)
        } catch {
            log("failed to reach URL")
        }
    })
})

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

export let myNPC_A = new NPC({ position: new Vector3(10, 1.5, 8) }, 'models/bela.glb', () => {
}, {faceUser: true, idleAnim: `Idle`})

export let myNPC = new NPC({ position: new Vector3(10, 1.5, 10) }, 'models/alice.glb', () => {
    myNPC.talk(ILoveCats, 0)
}, {faceUser: true, idleAnim: `Idle`})

export let ILoveCats: Dialog[] = []



const characters: any = {
    "Matthew": {
        "name": "Arnold",
        "npc": myNPC,
        "other": "Joanna"
    },
    "Joanna": {
        "name": "Mickey",
        "npc": myNPC_A,
        "other": "Matthew"
    },
    "Brian": {
        "name": "Scamjack",
        "npc": myNPC,
        "other": "Joanna"
    }
}


// Idle, Talk, Hello, Goodbye
function loadScript(script: any) {
    ILoveCats = []
    for (let n=0; n < script.episodes[0].story.length; n++) {
        const character_id = script.episodes[0].story[n].voice.split(",")[1]
        const character_name = characters[character_id].name
        const character_other_npc = characters[characters[character_id].other].npc

        if (script.episodes[0].story[n].type == "story") {
            ILoveCats.push({
                text: character_name + ": " + script.episodes[0].story[n].content[0],
                name: script.episodes[0].story[n].id,
                triggeredByNext: () => {
                    myNPC.playAnimation(`Idle`)
                    myNPC_A.playAnimation(`Idle`)
                    character_other_npc.playAnimation(`Talk`)
                    if (n==3) {
                        myNPC.followPath({
                            path: [new Vector3(2, 1.5, 2), new Vector3(2, 1.5, 4), new Vector3(6, 1.5, 2)],
                            totalDuration: 4,
                            loop: false,
                            curve: true,
                            startingPoint: 0,
                            onFinishCallback: () => {
                                log('Finished!')
                            }
                        })
                        myNPC_A.followPath({
                            path: [new Vector3(2, 1.5, 2), new Vector3(3, 1.5, 4), new Vector3(7, 1.5, 2)],
                            totalDuration: 4,
                            loop: false,
                            curve: true,
                            startingPoint: 0,
                            onFinishCallback: () => {
                                log('Finished!')
                            }
                        })
                    }
                }
            })
        } else if (script.episodes[0].story[n].type == "simple") {
            const id_yes = script.episodes[0].story[n].id+"yes"
            const id_no = script.episodes[0].story[n].id+"no"
            // Question
            ILoveCats.push({
                text: character_name + ": " + script.episodes[0].story[n].content[0],
                name: script.episodes[0].story[n].id,
                isQuestion: true,
                buttons: [
                    { label: `Yes`, goToDialog: id_yes },
                    { label: `No`, goToDialog: id_no }
                ]
            })
            // Answer yes
            ILoveCats.push({
                text: character_name + ": " + script.episodes[0].story[n].content[1],
                name: id_yes,
                triggeredByNext: () => {
                    myNPC.talk(ILoveCats, id_no)
                    myNPC.playAnimation(`Idle`)
                    myNPC_A.playAnimation(`Idle`)
                    character_other_npc.playAnimation(`Talk`)
                }
            })
            // Answer no
            ILoveCats.push({
                text: character_name + ": " + script.episodes[0].story[n].content[2],
                name: id_no,
                triggeredByNext: () => {
                    myNPC.talk(ILoveCats, id_no)
                    myNPC.playAnimation(`Idle`)
                    myNPC_A.playAnimation(`Idle`)
                    character_other_npc.playAnimation(`Talk`)
                }
            })
        }
    }
    ILoveCats[ILoveCats.length-1].isEndOfDialog = true
}
