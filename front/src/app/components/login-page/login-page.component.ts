import { Component } from '@angular/core';
import { Router } from '@angular/router';
import {NgIf} from '@angular/common';
import { NgOptimizedImage } from '@angular/common';
import { HttpClient, HttpHeaders, HttpClientModule } from '@angular/common/http';
import { HttpParams } from '@angular/common/http';

import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [
    FormsModule,
    NgIf,
    NgOptimizedImage,
    HttpClientModule

  ],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.css'
})

export class LoginPageComponent {

  constructor(private http: HttpClient, private router: Router) {}


  showOtherDiv: boolean = false;
  showdescriptionDiv: boolean = false;
  showverificationcodDiv: boolean = false;
  showOtherresetpassword: boolean = false;
  showSignupDiv: boolean = false;



  email: string = '';
  password: string = '';
  verificationCode: string = '';
  enteredCode: string = '';

  newPassword: string = '';
  confirmPassword: string = '';

  email_sign_up: string = '';
  password_sign_up: string = '';
  confirmPassword_sign_up: string = '';


  login() {

    if (!this.email || !this.password) {
      alert('Veuillez remplir les champs e-mail et mot de passe.');
      return;
    }

    const loginData = new HttpParams()
      .set('email', this.email)
      .set('password', this.password);

    console.log('Sending data:', loginData.toString());

    this.http.post('http://localhost:8083/api/auth/login', loginData.toString(), {
      headers: new HttpHeaders({
        'Content-Type': 'application/x-www-form-urlencoded'
      })
    }).subscribe(
      (response: any) => {
        if (response.success) {
          console.log('Login successful:', response.message);

          console.log('Token:', response.token);
          const token = response.token;
          localStorage.setItem('token', token);

          this.goTositeownerPage();
        } else {
          console.log('Login failed:', response.message);
          alert('Adresse e-mail ou mot de passe invalide. Veuillez réessayer.');
        }
      },
      (error) => {
        console.error('Login error:', error);
        alert('Une erreur s\'est produite lors de la connexion. Veuillez réessayer plus tard.');

      }
    );
  }

  async register() {
    if (!this.email_sign_up || !this.password_sign_up || !this.confirmPassword_sign_up) {
      alert('Veuillez remplir tous les champs.');
      return;
    }

    if (this.password_sign_up !== this.confirmPassword_sign_up) {
      alert('Les mots de passe ne correspondent pas. Veuillez réessayer.');
      return;
    }

    const userExists = await this.checkUserExists(this.email_sign_up);
    if (userExists) {
      alert('Cette adresse e-mail est déjà enregistrée. Veuillez en utiliser une autre.');
      return;
    }

    const registerData = new HttpParams()
      .set('email', this.email_sign_up)
      .set('password', this.password_sign_up);

    this.http.post('http://localhost:8083/api/auth/register', registerData.toString(), {
      headers: new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' }),
      responseType: 'text'
    }).subscribe(
      (response: string) => {
        console.log('Raw Response:', response);
        if (response.includes("User registered successfully")) {
          alert("Utilisateur enregistré avec succès!");
          this.sign_up();
        } else {
          alert(response);
        }
      },
      (error) => {
        console.error('Registration error:', error);
        alert('Une erreur s\'est produite lors de l\'inscription. Veuillez réessayer ultérieurement.');
      }
    );
  }
  sign_up() {
    this.showSignupDiv = !this.showSignupDiv;
    this.showOtherDiv = !this.showOtherDiv;
  }

  goTositeownerPage() {
    this.router.navigate(['/home']);
  }

  checkUserExists(email: string): Promise<boolean> {
    const checkEmailData = new HttpParams()
      .set('email', email);

    return new Promise((resolve) => {
      this.http.post('http://localhost:8083/api/auth/check-email', checkEmailData.toString(), {
        headers: new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' })
      }).subscribe(
        (response: any) => {
          if (response.exists) {
            resolve(true);
          } else {
            resolve(false);
          }
        },
        (error) => {
          console.error('Error checking user:', error);
          resolve(false);
        }
      );
    });
  }

  async sendCode() {
    if (!this.email) {
      alert('An error occurred during registration. Please try again later.');
      return;
    }

    const userExists = await this.checkUserExists(this.email);

    if (!userExists) {
      alert('Utilisateur introuvable. Veuillez consulter votre adresse e-mail.');
      return;
    }

    this.verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    const body = new HttpParams()
      .set('code', this.verificationCode)
      .set('recipientEmail', this.email);

    this.http.post(
      'http://localhost:8083/api/auth/send_code',
      body.toString(),
      {
        headers: new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' }),
      }
    ).subscribe(
      (sendResponse: any) => {
        if (sendResponse.message) {
          alert('Un code de vérification a été envoyé à votre adresse e-mail.');
          this.toggleOtherDiv();
        } else {
          alert('Échec de l\'envoi du code de vérification. Veuillez réessayer.');
        }
      },
      (error) => {
        console.error('Error:', error);
        alert('Une erreur s\'est produite lors de l\'envoi de l\'e-mail.');
      }
    );
  }
  toggleOtherDiv(): void {

    this.showOtherDiv = !this.showOtherDiv;
    this.showOtherresetpassword = false;
    this.showverificationcodDiv = true;
  }

  verifyCode() {
    if (!this.enteredCode) {
      alert('Veuillez saisir le code de vérification.');
      return;
    }

    if (this.enteredCode === this.verificationCode) {
      alert('Vérification réussie ! Vous pouvez maintenant réinitialiser votre mot de passe.');
      this.showverificationcodDiv = false;
      this.showOtherresetpassword = true;
    } else {
      alert('Code incorrect. Veuillez réessayer.');
    }
  }

  modifyPassword() {
    if (!this.newPassword || !this.confirmPassword) {
      alert('Veuillez saisir et confirmer votre nouveau mot de passe.');
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      alert('Les mots de passe ne correspondent pas. Veuillez réessayer.');
      return;
    }

    if (!this.email) {
      alert('Adresse e-mail manquante. Veuillez relancer la réinitialisation du mot de passe.');
      return;
    }

    const body = new HttpParams()
      .set('email', this.email)
      .set('newPassword', this.newPassword)
      .set('confirmPassword', this.confirmPassword);

    this.http
      .post(
        'http://localhost:8083/api/auth/update_password',
        body.toString(),
        {
          headers: new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' }),
        }
      )
      .subscribe(
        (response: any) => {
          if (response.success) {
            alert('Mot de passe mis à jour avec succès!');
            this.showOtherresetpassword = false;
            this.showOtherDiv = false;
          } else {
            alert('Échec de la mise à jour du mot de passe: ' + response.message);
            this.toggleOtherDiv();
          }
        },
        (error) => {
          console.error('Error updating password:', error);
          alert('Une erreur s\'est produite lors de la mise à jour du mot de passe. Veuillez réessayer.');
        }
      );
  }

}
