import React from 'react';
import { isUuid, slugifyStudentName } from '@/lib/slug';

export type Route =
  | { page: 'login' }
  | { page: 'dashboard' }
  | { page: 'students' }
  | { page: 'student-profile'; studentId: string; studentName?: string }
  | { page: 'student-academic-records'; studentId: string; studentName?: string }
  | { page: 'add-student' }
  | { page: 'edit-student'; studentId: string; studentName?: string };

let listeners: Array<() => void> = [];

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function normalizePath(path: string): string {
  if (!path) return '/';
  const clean = path.split('?')[0].split('#')[0];
  if (clean.length > 1 && clean.endsWith('/')) {
    return clean.slice(0, -1);
  }
  return clean || '/';
}

function routeFromPath(rawPath: string): Route {
  const url = new URL(rawPath, window.location.origin);
  const path = normalizePath(url.pathname);

  if (path === '/login') return { page: 'login' };
  if (path === '/') return { page: 'dashboard' };
  if (path === '/students') return { page: 'students' };
  if (path === '/students/add') return { page: 'add-student' };
  if (path.startsWith('/students/') && path.endsWith('/edit')) {
    const pathValue = safeDecode(path.split('/')[2]);
    const sid = safeDecode(url.searchParams.get('sid') || '');
    const studentId = isUuid(sid) ? sid : pathValue;
    return { page: 'edit-student', studentId };
  }
  if (path.startsWith('/students/') && path.endsWith('/academic-records')) {
    const pathValue = safeDecode(path.split('/')[2]);
    const sid = safeDecode(url.searchParams.get('sid') || '');
    const studentId = isUuid(sid) ? sid : pathValue;
    return { page: 'student-academic-records', studentId };
  }
  if (path.startsWith('/students/')) {
    const pathValue = safeDecode(path.split('/')[2]);
    const sid = safeDecode(url.searchParams.get('sid') || '');
    const studentId = isUuid(sid) ? sid : pathValue;
    return { page: 'student-profile', studentId };
  }
  return { page: 'dashboard' };
}

function getRoutePath(route: Route): string {
  switch (route.page) {
    case 'login':
      return '/login';
    case 'dashboard':
      return '/';
    case 'students':
      return '/students';
    case 'student-profile': {
      const slug = route.studentName ? slugifyStudentName(route.studentName) : route.studentId;
      const params = new URLSearchParams();
      params.set('sid', route.studentId);
      return `/students/${encodeURIComponent(slug)}?${params.toString()}`;
    }
    case 'student-academic-records': {
      const slug = route.studentName ? slugifyStudentName(route.studentName) : route.studentId;
      const params = new URLSearchParams();
      params.set('sid', route.studentId);
      return `/students/${encodeURIComponent(slug)}/academic-records?${params.toString()}`;
    }
    case 'add-student':
      return '/students/add';
    case 'edit-student': {
      const slug = route.studentName ? slugifyStudentName(route.studentName) : route.studentId;
      const params = new URLSearchParams();
      params.set('sid', route.studentId);
      return `/students/${encodeURIComponent(slug)}/edit?${params.toString()}`;
    }
    default:
      return '/';
  }
}

export function navigateTo(route: Route) {
  const nextPath = getRoutePath(route);
  const currentPathWithQuery = `${window.location.pathname}${window.location.search}`;
  if (currentPathWithQuery !== nextPath) {
    window.history.pushState({}, '', nextPath);
  }
  listeners.forEach((listener) => listener());
}

export function useRoute(): Route {
  const [, forceUpdate] = React.useReducer((x) => x + 1, 0);

  React.useEffect(() => {
    listeners.push(forceUpdate);
    return () => {
      listeners = listeners.filter((listener) => listener !== forceUpdate);
    };
  }, []);

  return routeFromPath(`${window.location.pathname}${window.location.search}`);
}

window.addEventListener('popstate', () => {
  listeners.forEach((listener) => listener());
});
