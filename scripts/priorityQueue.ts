//PriorityQueue of integers where lowest priority value is at the top
class PriorityQueue {
  array = new Array();

  constructor() {
    this.array.push({});
  }

  //runtime: O(n)
  //this doesn't really make sense for priorityqueues but our a*
  //needs to know if an element exists 
  public indexOf(val : number) {
        for (var i = 1; i < this.array.length; i++) {
            if (this.array[i].val === val) {
                return i;
            }
        }
        return -1;
    }

  //runtime: O(n)
  public update(val : number, newPriority : number) {
    var index = this.indexOf(val);
    if (index === -1) {
      return;
    }

    var oldPriority = this.array[index].priority;
    this.array[index].priority = newPriority;
    if (newPriority > oldPriority) {
      this.bubbleDown(index);
    }
    else if (newPriority < oldPriority) {
      this.bubbleUp(index);
    }
  }

  //runtime: O(1)
  public isEmpty() {
    if (this.array.length > 1) {
      return false;
    }
    return true;
  }

  //runtime: O(log(n))
  public enqueue(val : number, priority : number) {
    var last = this.array.push({ val: val, priority: priority }) - 1;
    this.bubbleUp(last);
  }

  //runtime: O(1)
  public dequeue(){
    var min = this.array[1].val;
    var last = this.array.length - 1;
    this.array[1] = this.array[last];
    this.array.splice(last, 1);
    this.bubbleDown(1);
    return min;
  }

  private parent(index : number) {
    return Math.floor(index/2);
  }

  private leftChild(index : number) {
  	return index*2;
  }

  private rightChild(index : number) {
  	return index*2+1;
  }

  private bubbleUp(index : number) {
    var cur = index;
    var parent = this.parent(cur);
    while (cur != 1 && this.array[cur].priority < this.array[parent].priority) {
      var tempPriority = this.array[cur].priority;
      var tempVal = this.array[cur].val; 
      this.array[cur].val = this.array[parent].val;
      this.array[cur].priority = this.array[parent].priority;
      this.array[parent].val = tempVal;
      this.array[parent].priority = tempPriority;
      cur = parent;
      parent = this.parent(parent);
    }
  }

  private bubbleDown(index : number) {
    var cur = index;
    var left = this.leftChild(1);
    var right = this.rightChild(1);

    while (this.array[left] != null) {
      if (this.array[right] == null) {
        if (this.array[left].priority < this.array[cur].priority) {
          //bubble down left
          var tempPriority = this.array[cur].priority;
          var tempVal = this.array[cur].val; 
          this.array[cur].val = this.array[left].val;
          this.array[cur].priority = this.array[left].priority;
          this.array[left].val = tempVal;
          this.array[left].priority = tempPriority;
          cur = left;
        }
        else {
          break;
        }
      }
      else {
        if (this.array[left].priority <= this.array[right].priority && this.array[left].priority < this.array[cur].priority) {
          //bubble down left
          var tempPriority = this.array[cur].priority;
          var tempVal = this.array[cur].val; 
          this.array[cur].val = this.array[left].val;
          this.array[cur].priority = this.array[left].priority;
          this.array[left].val = tempVal;
          this.array[left].priority = tempPriority;
          cur = left;
        }
        else if (this.array[left].priority > this.array[right].priority && this.array[right].priority < this.array[cur].priority) {
          //bubble down right
          var tempPriority = this.array[cur].priority;
          var tempVal = this.array[cur].val; 
          this.array[cur].val = this.array[right].val;
          this.array[cur].priority = this.array[right].priority;
          this.array[right].val = tempVal;
          this.array[right].priority = tempPriority;      
          cur = right;
        }
        else {
      	  break;
        }
      }
      left = this.leftChild(cur);
      right = this.rightChild(cur);
    }
  }  
}

