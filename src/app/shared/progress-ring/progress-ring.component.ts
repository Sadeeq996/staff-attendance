import { DecimalPipe } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-progress-ring',
  templateUrl: './progress-ring.component.html',
  styleUrls: ['./progress-ring.component.scss'],
  imports: [DecimalPipe]
})
export class ProgressRingComponent implements OnInit {

  @Input() progress = 0; // 0 → 1
  @Input() hours = 0;

  circumference = 2 * Math.PI * 54;


  constructor() { }
  ngOnChanges() { }

  ngOnInit() { }

  get ringColor() {
    if (this.progress < 0.34) return 'red';
    if (this.progress < 0.67) return 'orange';
    return 'green';
  }


}
