import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Subscription, timer } from 'rxjs';
import { People } from 'src/app/shared/models/people';
import { RankingService } from 'src/app/shared/ranking.service';
import * as uuid from 'uuid';
import { ClassType, Letter, Timer } from '../state/home.model';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  @ViewChild('inputTextarea') inputTextarea: ElementRef;
  
  subscription: Subscription;
  timerDisplay: Timer;
  letters: Letter[] = [];

  erroCounter = 0;
  hitCounter = 0;
  time = 0;
  tpm: number | null = null;

  isPrepared = false;
  hasError = false;
  started = false;
  isModalOpen = false;
  people: People = new People(0);

  constructor(private rankingService: RankingService) {
  }

  generateId = () => uuid.v4();

  ngOnInit() {
    this.fillTimer();
    this.formatText();
    this.setFocusElement('title');
  }

  formatText() {
    this.letters = [];
    const letters = `O programador é o profissional que cria, desenvolve e mantém diferentes tipos de softwares em sistemas amplos ou para uso em computadores pessoais. Ele usa linguagens de programação para criar comandos em programas e dar vida à novas funcionalidades e utilidades.`.split('');

    letters.forEach(text => {
      this.letters.push({
        id: this.generateId(),
        text: text,
        class: ClassType.default
      })
    })
  }

  prepareToStart(event: Event) {
    event.preventDefault();
    this.isPrepared = true;
    this.setFocusTextarea();
  }

  fillTimer() {
    this.timerDisplay = new Timer(
      { digit1: 0, digit2: 0 },
      { digit1: 0, digit2: 0 },
      { digit1: 0, digit2: 0 },
    )
  }

  startTimer() {
    this.subscription = timer(0, 1000).subscribe(() => {
      this.time++;
      this.timerDisplay = this.getDisplayTimer(this.time);
    });

    this.started = true;
  }

  stopTimer() {
    this.subscription.unsubscribe();
  }

  getDisplayTimer(time: number): Timer {
    const hours = '0' + Math.floor(time / 3600);
    const minutes = '0' + Math.floor(time % 3600 / 60);
    const seconds = '0' + Math.floor(time % 3600 % 60);

    return {
      hours: { digit1: Number(hours.slice(-2, -1)), digit2: Number(hours.slice(-1)) },
      minutes: { digit1: Number(minutes.slice(-2, -1)), digit2: Number(minutes.slice(-1)) },
      seconds: { digit1: Number(seconds.slice(-2, -1)), digit2: Number(seconds.slice(-1)) },
    };
  }

  checkText() {
    if (!this.started) {
      this.startTimer();
    }

    this.letters.forEach((letterText, index) => {
      const letterInput = this.inputTextarea.nativeElement.value[index];

      if (letterInput == null) {
        letterText.class = '';

      } else if (letterInput === letterText.text) {
        this.setCounter(letterText, ClassType.correct);
        letterText.class = ClassType.correct;

      } else {
        this.setCounter(letterText, ClassType.wrong);
        letterText.class = ClassType.wrong;
      }
    }) 

    if (this.finished()) {
      this.stopTimer();
      this.calculeTPM();
      this.addPeopleInRank();
      this.isModalOpen = true;
    }

    this.hasError = this.hasErrors();
  }

  calculeTPM() {
    if (this.inputTextarea && this.time) {
      const letters: Letter[] = this.inputTextarea.nativeElement.value;
      this.tpm = Number((letters.length / (this.time / 60)).toFixed(0));
    }
  }

  setCounter(letterText: Letter, classType: string) {
    if (letterText.class === ClassType.default) {

      if (classType === ClassType.correct) {
        this.hitCounter++;
          
      } else {
        this.erroCounter++;
      }
    }
  }

  setFocusTextarea() {
    setTimeout(() => this.inputTextarea.nativeElement.focus());
  }

  hasErrors(): boolean {
     return this.letters.some(letter => letter.class === ClassType.wrong);
  }

  wroteEverythingRight(): boolean {
    return this.letters.every(letter => letter.class === ClassType.correct);
  }

  finished(): boolean {
    if (!this.inputTextarea) {
      return false;
    }
    
    const typedEverything = this.letters.length === this.inputTextarea.nativeElement.value.length;
    return typedEverything && this.wroteEverythingRight();
  }

  restart() {
    this.isPrepared = false;
    this.hasError = false;
    this.started = false;
    this.isModalOpen = false;
    this.inputTextarea.nativeElement.value = null;

    this.stopTimer();
    this.resetCounters();
    this.fillTimer();
    this.formatText();
    this.people = new People(0); 
    this.setFocusElement('title');
  }

  resetCounters() {
    this.erroCounter = 0;
    this.hitCounter = 0;
    this.time = 0;
  }
  

  closeModal() {
    this.restart();
  }

  addPeopleInRank() {
    const people = this.getPeople();
    this.rankingService.createNewPeople(people);
  }

  getPeople(): People {
    return {
      ...this.people,
      hits: this.hitCounter,
      errors_count: this.erroCounter,
      tpm: this.tpm,
      time: this.getTime(),
      seconds: this.time
    }
  }

  getTime() {
    return `${this.timerDisplay.minutes.digit1}${this.timerDisplay.minutes.digit2}:${this.timerDisplay.seconds.digit1}${this.timerDisplay.seconds.digit2}`
  }

  setFocusElement(id: string) {
    setTimeout(() => document.getElementById(id).focus())
  }
}