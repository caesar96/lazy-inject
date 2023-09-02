import './polyfills';

import { bootstrapApplication } from '@angular/platform-browser';
import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  inject,
  Injector,
  Type,
} from '@angular/core';
import { Observable, filter, firstValueFrom, fromEvent } from 'rxjs';
import type { Greetings } from './greetings.service';

@Component({
  standalone: true,
  selector: 'my-app',
  template: `
  <h1>Hey!!!</h1>
  <p>hover me to preload business logic</p>
  <button [disabled]="!greetings" (click)="greetings.hello()">HI</button>
  `,
})
export class AppComponent {
  @LazyInject(
    () => import('./greetings.service').then((m) => m.Greetings)
  )
  greetings: Greetings | null = null;
}

export function LazyInject<T>(
  loader: () => Promise<Type<T>>,
  options: { strategy?: Strategy } = {}
) {
  const { strategy } = options;
  return (target, property) => {
    const instances = new WeakMap();

    

    Object.defineProperty(target, property, {
      async set(value) {
        console.log(value, property);
        /* @hack grab the injector when value is set to null. */
        if (value == null) {
          const injector = inject(Injector);
          await (strategy ?? mouseEnterStrategy)();
          const token = await loader();
          
          instances.set(this, injector.get(token));
          
        }
      },
      get() {
        return instances.get(this);
      },
    });
  };
}

export const mouseEnterStrategy: Strategy = async () => {
  const elementRef = inject(ElementRef);
  const cdr = inject(ChangeDetectorRef);
  await firstValueFrom(fromEvent(elementRef.nativeElement, 'mouseenter'));
  cdr.markForCheck();
};

export const viewportStrategy: Strategy = async () => {
  const elementRef = inject(ElementRef);
  const source$ = new Observable((observer) => {
    const intersector = new IntersectionObserver((entries) =>
      observer.next(entries[0].isIntersecting)
    );
    intersector.observe(elementRef.nativeElement);
    return () => intersector.disconnect();
  }).pipe(filter((isIntersecting) => isIntersecting === true));
  await firstValueFrom(source$);
};

export type Strategy = () => Promise<void>;

bootstrapApplication(AppComponent)
  .then((ref) => {
    // Ensure Angular destroys itself on hot reloads.
    if (window['ngRef']) {
      window['ngRef'].destroy();
    }
    window['ngRef'] = ref;

    // Otherwise, log the boot error
  })
  .catch((err) => console.error(err));
