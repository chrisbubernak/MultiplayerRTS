class Rectangle {
	private left: number;
	private right: number;
	private top: number;
	private bottom: number;

	constructor(left: number, right: number, top: number, bottom: number) {
	  this.left = left;
	  this.right = right;
	  this.top = top;
	  this.bottom = bottom;
	}

	public getLeft(): number {
	  return this.left;
	}

	public getRight(): number {
	  return this.right;
	}

	public getTop(): number {
	  return this.top;
	}

	public getBottom(): number {
	  return this.bottom;
	}

	public getWidth(): number {
	  return Math.abs(this.left - this.right);
	}

	public getHeight(): number {
	  return Math.abs(this.top - this.bottom);
	}
}
