import { Service } from '@angular/core';
import { Auth, onAuthStateChanged, signInWithEmailAndPassword, signOut, User } from 'firebase/auth';
import { from, Observable, ReplaySubject } from 'rxjs';
import { auth } from '../firebase.config';
 
@Service()
export class AuthService {
  private readonly firebaseAuth: Auth = auth;
 
  /**
   * ReplaySubject(1) — quem se inscrever depois já recebe o último valor
   * conhecido na hora, em vez de esperar o próximo evento de login/logout.
   * É o que o guard precisa pra decidir na entrada de cada rota.
   */
  private readonly userSubject = new ReplaySubject<User | null>(1);
  readonly user$: Observable<User | null> = this.userSubject.asObservable();
 
  constructor() {
    onAuthStateChanged(this.firebaseAuth, (user) => this.userSubject.next(user));
  }
 
  login(email: string, password: string): Observable<void> {
    const promise = signInWithEmailAndPassword(this.firebaseAuth, email, password).then(() => {});
    return from(promise);
  }
 
  logout(): Observable<void> {
    const promise = signOut(this.firebaseAuth);
    return from(promise);
  }
}