Array.prototype.remove = remove;

interface Array<T> {
  remove: typeof remove;
}

function remove<T>(item: T) {
  const i = this.indexOf(item);
  if (i < 0) return false;
  this.splice(i, 1);
  return true;
}
