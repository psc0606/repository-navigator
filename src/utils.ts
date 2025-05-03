export function removeFirstPart(path: string, sep: string = '/'): string {
    const parts = path.split(sep);
    // remove the first part of the array, if no '/' is found, return the original string
    parts.shift();
    return parts.join(sep);
}