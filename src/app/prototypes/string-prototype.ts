String.prototype.endWith = endWith;

interface String {
  endWith: typeof endWith;
}

function endWith(text: string): string {
  return this.endsWith(text) ? this : this + text;
}
