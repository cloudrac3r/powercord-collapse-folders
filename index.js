const {Plugin} = require("powercord/entities")
const webpack = require("powercord/webpack")
const {getModule} = webpack
const {getOwnerInstance} = require("powercord/util")

module.exports = class CollapseFolders extends Plugin {
	constructor() {
		super()
		this.bound = this.listener.bind(this)
	}

	/**
	 * @param {({name: string, key: string, filter: string[]})[]} classes
	 */
	async loadClasses(classes) {
		/**
		 * @type {Map<string, string>}
		 */
		let result = new Map()
		await Promise.all(classes.map(c => {
			return getModule(c.filter).then(m => {
				let className = m[c.key].split(" ")[0]
				result.set(c.name, className)
			}).catch(err => {
				console.error(err)
			})
		}))
		return result
	}

	async startPlugin() {
		this.classes = await this.loadClasses([
			{name: "guilds", key: "guilds", filter: ["guilds"]},
			{name: "scroller", key: "scroller", filter: ["scrollerWrap", "systemPad"]},
			{name: "folderWrapper", key: "wrapper", filter: ["folder"]},
			{name: "expandedGuilds", key: "expandedGuilds", filter: ["folder"]},
			{name: "folder", key: "folder", filter: ["folder"]}
		])
		document.addEventListener("keydown", this.bound)
	}

	pluginWillUnload() {
		document.removeEventListener("keydown", this.bound)
	}

	/**
	 * @param {KeyboardEvent} event
	 */
	listener(event) {
		if ((event.key == "a" || event.key == "A") && event.ctrlKey && event.altKey) {
			console.log(this.classes)
			let guilds = document.querySelector(`.${this.classes.get("guilds")} .${this.classes.get("scroller")}`)
			let folderWrappers = []
			for (let i = 0; i < guilds.children.length; i++) {
				let child = guilds.children[i]
				if (child.classList.contains(this.classes.get("folderWrapper"))) {
					folderWrappers.push(child)
				}
			}
			let openFolderWrappers = folderWrappers.filter(wrapper => wrapper.querySelector("."+this.classes.get("expandedGuilds")))
			if (openFolderWrappers.length == 0) {
				// all folders are closed, so open them
				folderWrappers.forEach(wrapper => this.clickFolder(wrapper))
			} else {
				// some folders are open, so close them
				openFolderWrappers.forEach(wrapper => this.clickFolder(wrapper))
			}
		}
	}

	/**
	 * @param {HTMLElement} wrapper
	 */
	clickFolder(wrapper) {
		getOwnerInstance(wrapper.querySelector("."+this.classes.get("folder"))).props.onClick()
	}
}
