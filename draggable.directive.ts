/* tslint:disable */
import {Directive, Input, ElementRef, HostListener, Output, EventEmitter, OnInit, Renderer, OnDestroy} from '@angular/core';

/**
 * DnD Link Tabs Functionality Directive
 */
@Directive({
  selector: '[cmdDraggableLinkTab]'
})
export class DraggableDirective implements OnInit, OnDestroy {
  @Input('cmdDraggableLinkTab') data: any;
  @Output() onLinkTabDraggingEnd: EventEmitter<any> = new EventEmitter();

  private movableElement: HTMLElement;
  private nodes: HTMLCollection;
  private sourceElements : Array<HTMLElement>;

  private isMouseDown: boolean = false;
  private isMouseMoveLast: boolean = false;


  private offsetX: number;
  private minLeftOffset: number;

  private currentIndex: number = 0;
  private destinationIndex: number = 0;

  private mouseMoveGlobalListener: Function;
  private mouseUpGlobalListener: Function;

  constructor(private _elementRef: ElementRef, private renderer: Renderer) {
    this.mouseMoveGlobalListener = renderer.listenGlobal('document', 'mousemove', this.onMouseMove);
    this.mouseUpGlobalListener = renderer.listenGlobal('document', 'mouseup', this.onMouseUp);
  }

  ngOnInit() : void {
    this.resetCoreInstances();
  }

  /**
   * Reiniting core dependencies
   */
  resetCoreInstances(): void {
    this.movableElement = this._elementRef.nativeElement;
    this.nodes = this.movableElement.parentElement.children;
    this.sourceElements = Array.from(this.nodes, element => <HTMLElement>element).filter(e => e != this.movableElement);
  }

  /**
   * Calcilate search tab restriction offset and offset to point X on movable element
   * @param clientX
   */
  calculateOffsets(clientX: number): void {
    this.offsetX = this.movableElement.offsetLeft - clientX;
    this.minLeftOffset = this.nodes[0].clientWidth;
  }


  @HostListener('mousedown', ['$event'])
  private onMouseDown = ($event: MouseEvent) => {
    if ($event.stopPropagation) {
      $event.stopPropagation();
    }
    if (this.data.isDraggable) {
      this.isMouseDown = true;

      this.resetCoreInstances();
      this.setActiveImitation($event.clientX);
    }
    return false;
  }

  private onMouseMove = ($event: MouseEvent) => {
    if (this.isMouseDown) {
      this.isMouseMoveLast = true;

      this.coreApplication($event);
    }
    return false;
  }

  private onMouseUp = ($event: MouseEvent) => {
    if (this.isMouseDown && this.isMouseMoveLast) {
      this.resetDndChanges();
      this.pushChangesOnDragEnding();
    }
    return false;
  }

  /**
   * Change service store
   */
  pushChangesOnDragEnding() : void {
    const { path, id } = this.data;
    const tabLinkDraggableItem = {
      movableItemId: id,
      targetItemPosition: this.currentIndex,
      path
    };
    this.onLinkTabDraggingEnd.emit(tabLinkDraggableItem);
  }

  /**
   * Generate zone elements position weights
   * @returns {number[]}
   */
  generateWeights() :Array<number> {
    const positions = this.sourceElements.map((element) => element.offsetLeft);
    positions.push(positions[positions.length-1] + this.movableElement.clientWidth);
    return positions;
  }

  /**
   * Get current dnd element position by current dnd element weight
   * @param weights
   * @param movablePositionWeight
   * @returns {number}
   */
  getCurrentIndex(weights: Array<number>, movablePositionWeight: number) :number {
    const candidates = weights.map(weights => Math.abs(weights - movablePositionWeight));

    let candidateIndex = candidates.indexOf(Math.min.apply(Math, candidates));
    candidateIndex = candidateIndex > 1 ? candidateIndex: 1;

    return candidateIndex;
  }

  /**
   * Set index of elements when dnd element will be inserted
   * @param index
   */
  setDestinationIndex(index: number): void {
    this.destinationIndex = index;
  }

  /**
   * Set index of current dnd element position
   * @param index
   */
  setCurrentIndex(index: number): void {
    this.currentIndex = index;
  }

  /**
   * Reneder absolute dnd move action and margin for inserted place
   * @param selectableOffset
   */
  renderMovingAction(selectableOffset: number): void {
    this.setMovableStyle(selectableOffset);
    this.sourceElements[this.destinationIndex].style.marginRight = `${0}px`;
    this.setDestinationIndex(this.currentIndex - 1);
    this.sourceElements[this.destinationIndex].style.marginRight = `${this.movableElement.clientWidth}px`;
  }

  /**
   * Start calculation point
   * @param $event
   */
  coreApplication($event: MouseEvent): void {
    const movablePositionWeight = this.movableElement.offsetLeft + (this.movableElement.clientWidth / 2);

    const weights = this.generateWeights();
    const candidateIndex = this.getCurrentIndex(weights, movablePositionWeight);

    this.setCurrentIndex(candidateIndex);

    const selectableOffset = $event.clientX + this.offsetX;
    this.renderMovingAction(selectableOffset);
  }

  /**
   * Set element movable styles
   * @param selectableOffset
   */
  setMovableStyle(selectableOffset: number) {
    if (this.isMouseMoveLast) {
      this.movableElement.classList.add('movable');
      this.movableElement.style.left = `${(selectableOffset > this.minLeftOffset ? selectableOffset : this.minLeftOffset)}px`;
    }
  }

  /**
   * Reset all move changes
   */
  resetDndChanges() :void {
    this.movableElement.classList.remove('movable');
    this.sourceElements[this.currentIndex - 1].style.marginRight = `0px`;
    this.sourceElements[this.destinationIndex > 1 ? this.destinationIndex - 1 : 1].style.marginRight = `${0}px`;
    this.movableElement.style.left = `0px`;

    this.isMouseDown = false;
    this.isMouseMoveLast = false;
  }

  /**
   * Set current movable element highlight and check offsets
   * @param clientX
   */
  setActiveImitation(clientX: number) :void {
    this.calculateOffsets(clientX);
    this.sourceElements.forEach(el => el.classList.remove('active-tab'));
    this.movableElement.classList.add('active-tab');
  }

  /**
   * Unregistered document listeners
   */
  destroyGlobalListeners() :void {
    this.mouseMoveGlobalListener();
    this.mouseUpGlobalListener();
  }

  ngOnDestroy() :void {
    this.destroyGlobalListeners();
  }

}
