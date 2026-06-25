/**
 * Utility to get the correct Filepath for a Level
 * 
 * @param {string} mode pass of level mode
 * @param {string} id pass of level id
 * @returns {JSON.Response}
 */

export async function getFile(mode, id){
    
    const rawMeta = await fetch(`/data/${mode}/level_meta.json`);
    const meta = await rawMeta.json();
    console.log(meta);
    
    const level = meta.find(line => String(line.id) === String(id));
    if (!level) return new Response(JSON.stringify({error: "File not found"}), {status: 400});
    console.log(level);

    const title = level.title.replaceAll(" ", "_");
    console.log(`title: ${title}`);
    const filename = `${id}-${title}.json`;
    const path = `/data/${mode}/${filename}`
    console.log(path);
    
    return new Response(JSON.stringify({filename: path}), {status: 200});
}