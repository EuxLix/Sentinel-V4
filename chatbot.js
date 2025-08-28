const Groq = require("groq-sdk");

const groqApiKey = process.env.GROQ_API_KEY;
const allowedChannelId = process.env.CHATBOT_CHANNEL_ID;
const systemPrompt =
    "Your name is sentinel. Your owner is euxlix. Your answers should be short, friendly, and in Turkish. You are a Discord bot and you are here to help users.";

if (!groqApiKey || !allowedChannelId) {
    console.warn(
        "[UYARI] Gerekli .env değişkenleri bulunamadı! Chatbot modülü devre dışı.",
    );
    module.exports = () => {};
    return;
}

const groq = new Groq({ apiKey: groqApiKey });
const commonPrefixes = /^[!?.>_]/;

function splitText(text, maxLength = 2000) {
    if (text.length <= maxLength) return [text];
    const chunks = [];
    const words = text.split(" ");
    let currentChunk = "";
    for (const word of words) {
        if (currentChunk.length + word.length + 1 > maxLength) {
            chunks.push(currentChunk);
            currentChunk = "";
        }
        currentChunk += (currentChunk ? " " : "") + word;
    }
    if (currentChunk) chunks.push(currentChunk);
    return chunks;
}

// Karma hafıza için ayarlar
const MAX_MESSAGES = 10;          // en fazla 10 mesaj
const MAX_AGE_MS = 15 * 60 * 1000; // 15 dakika

function pruneConversation(conversation) {
    const now = Date.now();
    // Süreyi filtrele
    conversation = conversation.filter((m) => now - m.timestamp < MAX_AGE_MS);
    // Maksimum mesaj sayısını koru
    while (conversation.length > MAX_MESSAGES) {
        conversation.shift();
    }
    return conversation;
}

module.exports = (client) => {
    if (!client.conversations) client.conversations = new Map();
    console.log(
        "[BİLGİ] Chatbot modülü aktif edildi.",
    );

    client.on("messageCreate", async (message) => {
        if (message.channel.id !== allowedChannelId || message.author.bot) return;

        const userInput = message.content;
        if (!userInput || commonPrefixes.test(userInput)) return;

        try {
            await message.channel.sendTyping();

            let userConversation = client.conversations.get(message.author.id) || [];
            userConversation = pruneConversation(userConversation);

            const messagesToSend = [
                { role: "system", content: systemPrompt },
                ...userConversation.map((m) => ({ role: m.role, content: m.content })),
                { role: "user", content: userInput },
            ];

            const stream = await groq.chat.completions.create({
                messages: messagesToSend,
                model: "openai/gpt-oss-20b",
                stream: true,
            });

            let fullResponse = "";
            for await (const chunk of stream) {
                fullResponse += chunk.choices[0]?.delta?.content || "";
            }

            if (!fullResponse.trim()) return;

            const responseChunks = splitText(fullResponse);
            await message.reply({
                content: responseChunks[0],
                allowedMentions: { repliedUser: false },
            });
            for (let i = 1; i < responseChunks.length; i++) {
                await message.channel.send({ content: responseChunks[i] });
            }

            // Yeni mesajları kaydet (timestamp ile)
            userConversation.push({ role: "user", content: userInput, timestamp: Date.now() });
            userConversation.push({ role: "assistant", content: fullResponse, timestamp: Date.now() });

            client.conversations.set(message.author.id, userConversation);
        } catch (error) {
            console.error("[HATA] Chatbot modülünde bir hata oluştu:", error);
        }
    });
};