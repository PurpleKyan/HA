import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ApiService } from './api.service';
import { API_URL } from './config';

describe('ApiService', () => {
  let service: ApiService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ApiService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('passes trail filters as query parameters', () => {
    service.trails({ search: 'Kampalili', max_budget: 1500, sort: 'rating' }).subscribe();

    const request = httpTesting.expectOne((req) => req.url === `${API_URL}/trails`);
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('search')).toBe('Kampalili');
    expect(request.request.params.get('max_budget')).toBe('1500');
    expect(request.request.params.get('sort')).toBe('rating');
    request.flush([]);
  });
});