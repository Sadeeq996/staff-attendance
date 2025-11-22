import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpHandler, HttpRequest } from '@angular/common/http';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
    intercept(req: HttpRequest<any>, next: HttpHandler) {
        // Read token from localStorage (key used by your auth flow)
        const token = localStorage.getItem('auth_token');
        if (token) {
            const cloned = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
            return next.handle(cloned);
        }
        return next.handle(req);
    }
}
