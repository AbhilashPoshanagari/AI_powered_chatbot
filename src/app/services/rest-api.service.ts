import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RestApiService {

  constructor(private httpClient: HttpClient){

  }

   getRequest(url: string) {
    return this.httpClient.get<any>(url).pipe(
      map((res) => {
        if (res.status === 200) {
          return {status: res.status, open_ai: res.openai_functions };
        } else {
          return { status: 500, error: 'something went wrong' };
        }
      }),
      catchError((err) => {
        console.error('API error:', err);
        return of({ error: 'API request failed' });
      })
    );
  }
}
