import { signal } from '@angular/core';
import { finalize, Observable } from 'rxjs';

export function useLoading() {
  const isLoading = signal(false);

  const withLoading = <T>(request$: Observable<T>): Observable<T> => {
    isLoading.set(true);
    return request$.pipe(
      finalize(() => isLoading.set(false))
    );
  };

  return { isLoading, withLoading };
}
