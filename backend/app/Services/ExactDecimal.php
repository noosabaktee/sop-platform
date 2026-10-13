<?php
namespace App\Services;

use Illuminate\Validation\ValidationException;

/** Monetary/quantity calculations use scaled integers, never floats. */
final class ExactDecimal {
 public static function parse(string $value,int $places=2):int {
  if(!preg_match('/^\d{1,12}(?:\.\d{1,'.$places.'})?$/D',$value)){
   throw ValidationException::withMessages(['amount'=>'Format angka tidak valid.']);
  }
  [$whole,$fraction]=array_pad(explode('.',$value,2),2,'');
  return (int)$whole * (10**$places) + (int)str_pad($fraction,$places,'0');
 }
 public static function format(int $value,int $places=2):string {
  $scale=10**$places;
  return ($value<0?'-':'').intdiv(abs($value),$scale).'.'.str_pad((string)(abs($value)%$scale),$places,'0',STR_PAD_LEFT);
 }
 /** quantity 4 decimal places × price 2 decimal places = money with rounded cents */
 public static function line(string $quantity,string $unitPrice):int {
  $q=self::parse($quantity,4);$price=self::parse($unitPrice,2);
  abort_if($q<=0||$q>100000000000,422,'Quantity di luar batas.');
  abort_if($price>intdiv(PHP_INT_MAX,$q),422,'Nilai terlalu besar.');
  return intdiv($q*$price+5000,10000);
 }
}
