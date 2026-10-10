const crypto = require("crypto");
const { PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const convertHeic = require("heic-convert");
const r2 = require("../config/r2");

const BUCKET = "kinova";
const PUBLIC_URL = "https://pub-20adc7d32978483dafa25eec6f011365.r2.dev";

// Marques ISO-BMFF utilisées par les photos HEIC/HEIF (iPhone, Samsung...)
const HEIF_BRANDS = ["heic", "heix", "hevc", "hevx", "heim", "heis", "hevm", "hevs", "mif1", "msf1"];
const AVIF_BRANDS = ["avif", "avis"];

// ==========================================
// Détecte le vrai type de l'image à partir de ses octets
// (le mimetype envoyé par le téléphone n'est pas fiable)
// ==========================================
function detectImageType(buffer) {

    if (!buffer || buffer.length < 12) return null;

    if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF)
        return { ext: "jpg", mime: "image/jpeg" };

    if (buffer.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])))
        return { ext: "png", mime: "image/png" };

    if (buffer.toString("ascii", 0, 4) === "GIF8")
        return { ext: "gif", mime: "image/gif" };

    if (buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP")
        return { ext: "webp", mime: "image/webp" };

    if (buffer.toString("ascii", 0, 2) === "BM")
        return { ext: "bmp", mime: "image/bmp" };

    const tiff = buffer.toString("ascii", 0, 4);
    if (tiff === "II*\u0000" || tiff === "MM\u0000*")
        return { ext: "tiff", mime: "image/tiff" };

    if (buffer.toString("ascii", 4, 8) === "ftyp") {

        // Marque principale + marques compatibles
        const boxSize = Math.min(buffer.readUInt32BE(0), buffer.length);
        const brands = [buffer.toString("ascii", 8, 12)];
        for (let i = 16; i + 4 <= boxSize; i += 4) {
            brands.push(buffer.toString("ascii", i, i + 4));
        }

        if (brands.some(b => AVIF_BRANDS.includes(b)))
            return { ext: "avif", mime: "image/avif" };

        if (brands.some(b => HEIF_BRANDS.includes(b)))
            return { ext: "heic", mime: "image/heic" };
    }

    return null;
}

// ==========================================
// Envoie une image (en mémoire) sur R2
// Les HEIC/HEIF sont convertis en JPEG pour être lisibles partout
// ==========================================
async function uploadImage(file, folder) {

    const type = detectImageType(file.buffer);

    if (!type) {
        const err = new Error(`Format d'image non supporté : ${file.originalname}`);
        err.status = 400;
        throw err;
    }

    if (type.ext === "gif") {
        const err = new Error("Les images GIF ne sont pas acceptées");
        err.status = 400;
        throw err;
    }

    let body = file.buffer;
    let ext = type.ext;
    let mime = type.mime;

    if (type.ext === "heic") {
        body = Buffer.from(await convertHeic({
            buffer: file.buffer,
            format: "JPEG",
            quality: 0.85
        }));
        ext = "jpg";
        mime = "image/jpeg";
    }

    const key = `${folder}/${Date.now()}-${crypto.randomBytes(6).toString("hex")}.${ext}`;

    await r2.send(new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: body,
        ContentType: mime
    }));

    return `${PUBLIC_URL}/${key}`;
}

async function uploadImages(files, folder) {

    const urls = [];

    try {
        for (const file of files || []) {
            urls.push(await uploadImage(file, folder));
        }
    } catch (err) {
        // On ne laisse pas d'images orphelines si une seule échoue
        await deleteImages(urls);
        throw err;
    }

    return urls;
}

// ==========================================
// Supprime des images du bucket à partir de leurs URLs
// ==========================================
async function deleteImages(urls) {

    const keys = (urls || [])
        .map(url => url && url.split(".r2.dev/")[1])
        .filter(Boolean)
        .map(key => decodeURIComponent(key));

    const results = await Promise.allSettled(
        keys.map(key => r2.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key })))
    );

    results.forEach((result, i) => {
        if (result.status === "rejected")
            console.log("Échec suppression R2 :", keys[i], result.reason?.message);
    });
}

module.exports = { detectImageType, uploadImages, deleteImages };
