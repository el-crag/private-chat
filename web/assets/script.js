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

	#appendMessage(message, down = true) {
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

		if (down) {
			messengerChat.appendChild(wrapper)
			messengerChat.scrollTop += 500;
		}
		else {
			messengerChat.insertBefore(wrapper, messengerChat.firstChild)
		}
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
			order: {
				by: "instant",
				type: "desc"
			},
			limit: 6
		}).then(messages => {
			for (const message of messages) {
				const m = new Message()
				m.assign(message)
				this.#appendMessage(m, false)
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

class Security {
	#privateKey
	#publicKey

	constructor(privateKey, publicKey) {
		this.#privateKey = privateKey
		this.#publicKey = publicKey
	}

	async generateKeyPair() {
		try {
			const keyPair = await crypto.subtle.generateKey(
				{
					name: "RSA-PSS",
					modulusLength: 2048, // Tamaño de la clave en bits
					publicExponent: new Uint8Array([1, 0, 1]), // 65537 en hexadecimal
					hash: "SHA-256" // Algoritmo de hash para la firma
				},
				true, // Permite el uso de las claves para firma y verificación
				["sign", "verify"] // Usos permitidos de las claves
			);

			this.#privateKey = keyPair.privateKey
			this.#publicKey = keyPair.publicKey
		} catch (error) {
			console.error("Error generando el par de claves:", error)
		}
	}

	async signMessage(message) {
		try {
			const encoder = new TextEncoder()
			const data = encoder.encode(message)

			const signature = await crypto.subtle.sign(
				{
					name: "RSA-PSS",
					saltLength: 32 // longitud del "salt" en bytes
				},
				this.#privateKey,
				data
			);

			return new Uint8Array(signature)
		} catch (error) {
			console.error("Error firmando el mensaje:", error)
		}
	}

	async verifySignature(message, signature) {
		try {
			const encoder = new TextEncoder()
			const data = encoder.encode(message)

			const isValid = await crypto.subtle.verify(
				{
					name: "RSA-PSS",
					saltLength: 32
				},
				this.#publicKey,
				signature,
				data
			);

			return isValid;
		} catch (error) {
			console.error("Error verificando la firma:", error)
		}
	}

	async exportCryptoKey(key) {
		const exported = await window.crypto.subtle.exportKey("spki", key)
		const exportedAsString = String.fromCharCode.apply(null, new Uint8Array(exported))
		const exportedAsBase64 = window.btoa(exportedAsString)
		const pemExported = `-----BEGIN PUBLIC KEY-----\n${exportedAsBase64}\n-----END PUBLIC KEY-----`

		return pemExported
	}

	async exportPublicKey() {
		const exportedPublicKey = await this.exportCryptoKey(this.#publicKey)
		return exportedPublicKey
	}

	async function testSign() {
		const exportedPublic = await security.exportPublicKey()
		console.log("Public:", exportedPublic)

		// sign
		const message = "Este es un mensaje de prueba."
		const signature = await security.signMessage(message)
		console.log("Firma generada:", Array.from(signature))

		// Verify
		const isValid = await security.verifySignature(message, signature)
		console.log("La firma es válida:", isValid)
	}
}

var chat = new Chat()
chat.initDatabase()
