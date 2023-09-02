import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class Greetings {
  hello() {
    alert('Hello!');
  }
}

console.log('greetings.service.ts loaded');
