// Objectif : décrire les types de l’API métier publique.
import type{JevProvider}from"./jev.mjs";export const IMPACTS:readonly string[];export function site(input:any):any;export function restriction(input:any):any;export function assessOperation(site:any,operation:string,restriction:any,provider:JevProvider,options?:{at?:Date|string}):Promise<any>;
