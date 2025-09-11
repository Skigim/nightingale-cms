// Modern ESM wrapper around fuse.js using npm package.
import FuseLib from 'fuse.js';

const fusePromise = Promise.resolve(FuseLib);

export default fusePromise;

export function getFuse() {
  return FuseLib;
}
