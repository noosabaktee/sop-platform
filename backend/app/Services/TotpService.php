<?php

namespace App\Services;

use Illuminate\Support\Str;

class TotpService
{
    private const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

    public function secret(int $bytes = 20): string
    {
        $data = random_bytes($bytes);
        $bits = '';
        foreach (str_split($data) as $char) {
            $bits .= str_pad(decbin(ord($char)), 8, '0', STR_PAD_LEFT);
        }
        $out = '';
        foreach (str_split($bits, 5) as $chunk) {
            $out .= self::ALPHABET[bindec(str_pad($chunk, 5, '0'))];
        }

return $out;
    }

    public function verify(string $secret, string $code, ?int $time = null): bool
    {
        if (! preg_match('/^\d{6}$/', $code)) {
            return false;
        }$counter = intdiv($time ?? time(), 30);
        for ($offset = -1; $offset <= 1; $offset++) {
            if (hash_equals($this->code($secret, $counter + $offset), $code)) {
                return true;
            }
        }

return false;
    }

    public function code(string $secret, int $counter): string
    {
        $key = $this->decode($secret);
        $binary = pack('N2', intdiv($counter, 4294967296), $counter % 4294967296);
        $hash = hash_hmac('sha1', $binary, $key, true);
        $offset = ord($hash[19]) & 15;
        $value = ((ord($hash[$offset]) & 127) << 24) | ((ord($hash[$offset + 1]) & 255) << 16) | ((ord($hash[$offset + 2]) & 255) << 8) | (ord($hash[$offset + 3]) & 255);

        return str_pad((string) ($value % 1000000), 6, '0', STR_PAD_LEFT);
    }

    public function recoveryCodes(): array
    {
        return array_map(fn () => Str::lower(Str::random(5).'-'.Str::random(5)), range(1, 8));
    }

    private function decode(string $value): string
    {
        $bits = '';
        foreach (str_split(strtoupper(preg_replace('/[^A-Z2-7]/i', '', $value))) as $char) {
            $pos = strpos(self::ALPHABET, $char);
            if ($pos === false) {
                continue;
            }$bits .= str_pad(decbin($pos), 5, '0', STR_PAD_LEFT);
        }
        $out = '';
        foreach (str_split($bits, 8) as $chunk) {
            if (strlen($chunk) === 8) {
                $out .= chr(bindec($chunk));
            }
        }

return $out;
    }
}
