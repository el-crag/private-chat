class Chat {
	#db

	constructor() {
		this.#db = new JsStore.Connection()
	}

	handleMessage(form) {
		let message = new Message(form.elements.message.value, true)

		if (!message.hasContent()) {
			return
		}

		this.#appendMessage(message)

		form.reset()

		message.save(this.#db)
	}

	#appendMessage(message) {
		const wrapper = document.createElement("div")
		wrapper.setAttribute("class", message.isOwn() ? "msg right-msg" : "msg left-msg")

		const bubble = document.createElement("div")
		bubble.setAttribute("class", "msg-bubble")
		wrapper.appendChild(bubble)

		const info = document.createElement("div")
		info.setAttribute("class", "msg-info")
		bubble.appendChild(info)

		const name = document.createElement("div")
		name.setAttribute("class", "msg-info-name")
		name.textContent = "You"
		info.appendChild(name)

		const time = document.createElement("div")
		time.setAttribute("class", "msg-info-time")
		time.textContent = message.getFormattedDate()
		info.appendChild(time)

		const content = document.createElement("div")
		content.setAttribute("class", "msg-text")
		content.textContent = message.getContent()
		bubble.appendChild(content)

		if (message.isOwn()) {
			const indicator = document.createElement("div")
			indicator.setAttribute("class", "msg-indicator")
			indicator.textContent = "⌛"
			bubble.appendChild(indicator)
		}

		messengerChat.appendChild(wrapper)
		messengerChat.scrollTop += 500;
	}

	initDatabase() {
		let tableOption = {
			name: "option",
			columns: {
				key: { primaryKey: true, dataType: "string" },
				option: { notNull: false, dataType: "string" },
			}
		}

		let tableMessage = {
			name: "message",
			columns: {
				uuid: { primaryKey: true, dataType: "string" },
				sent: { notNull: true, dataType: "boolean" },
				own: { notNull: true, dataType: "boolean" },
				content: { notNull: true, dataType: "string" },
				instant: { notNull: true, dataType: "date_time" },
			}
		}

		let db = {
			name: "chat",
			tables: [
				tableOption,
				tableMessage,
			],
		}

		this.#db.initDb(db).then((isDbCreated) => {
			if(isDbCreated) {
				alert("db created")
			}

			this.#populate()
		})
		.catch(e => {
			console.error(e)
		})
	}

	#populate() {
		let results = this.#db.select({
			from: "message",
			limit: 6
		}).then(messages => {
			for (const message of messages) {
				const m = new Message()
				m.assign(message)
				this.#appendMessage(m)
			}
		})
	}
}

class Message {
	#content
	#date
	#status
	#own
	#uuid

	constructor(content, isNew = false) {
		this.#content = content
		if (isNew) {
			this.#date = new Date()
			this.#uuid = crypto.randomUUID().replace(/-/g, "").padStart(32, '0')
			this.#status = false
		}

		this.#own = true
	}

	assign(message) {
		this.#content = message.content
		this.#own = message.own
		this.#uuid = message.uuid
		this.#date = message.instant
		this.#status = message.sent
	}

	save(db) {
		let message = {
			uuid: this.#uuid,
			sent: this.#status,
			own: this.#own,
			content: this.#content,
			instant: this.#date,
		}

		db.insert({
			validation: false,
			into: "message",
			values: [message],
		})
	}

	setOwn(own) {
		return this.#own = own
	}

	isOwn() {
		return this.#own
	}

	hasContent() {
		return this.#content.length > 0
	}

	setDate(date) {
		this.#date = date
	}

	getContent() {
		return this.#content
	}

	getFormattedDate() {
		const h = "0" + this.#date.getHours()
		const m = "0" + this.#date.getMinutes()

		return `${h.slice(-2)}:${m.slice(-2)}`
	}
}

var chat = new Chat()
chat.initDatabase()
