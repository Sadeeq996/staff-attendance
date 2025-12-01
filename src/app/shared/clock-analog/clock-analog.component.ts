import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription, interval } from 'rxjs';

@Component({
  selector: 'app-clock-analog',
  templateUrl: './clock-analog.component.html',
  styleUrls: ['./clock-analog.component.scss'],
  imports: [CommonModule]
})
export class ClockAnalogComponent implements OnInit, OnDestroy {

  hoursDeg: number = 0;
  minutesDeg: number = 0;
  secondsDeg: number = 0;
  time: string = '';
  date: string = '';
  private subscription!: Subscription;

  ngOnInit() {
    this.updateClock();

    this.subscription = interval(1000).subscribe(() => {
      this.updateClock();
    });
    // this.genNumber();
  }

  updateClock() {
    const now = new Date();

    // Analog clock angles
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();

    this.hoursDeg = (hours % 12) * 30 + minutes * 0.5; // 360/12 = 30 deg per hour + half degree per minute
    this.minutesDeg = minutes * 6; // 360/60 = 6 deg per minute
    this.secondsDeg = seconds * 6;

    // Digital time
    this.time = now.toLocaleTimeString('en-US', { hour12: false });
    this.date = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }

  ngOnDestroy() {
    if (this.subscription) this.subscription.unsubscribe();
  }

  hour_hand = document.getElementById("hour_hand");
  min_hand = document.getElementById("min_hand");
  sec_hand = document.getElementById("sec_hand");
  segments = document.getElementById("segments");
  num_rotation = 0;
  seg_rotation = 0;

  // genNumber() {
  //   console.log('generating')
  //   for (let index = 0; index <= 60; index++) {
  //     //const element = array[index];
  //     const segment = document.createElement('div');
  //     const mark = document.createElement('div');
  //     segment.classList.add('segment');
  //     segment.style.transform = `rotate(${this.seg_rotation += 6}deg) translate(-50%, -100%)`;
  //     mark.classList.add('mark');
  //     if (index % 5 === 0) {
  //       const num = document.createElement('span');
  //       num.innerText = String(index / 5);
  //       num.classList.add('num');
  //       num.style.transform = `translateX(-50%) rotate(-${this.num_rotation += 30}deg)`;
  //       mark.classList.add('mark-hour');
  //       segment.appendChild(mark);
  //       segment.appendChild(num);
  //     }
  //   }

  // }



}
