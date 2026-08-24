<?php

namespace App\Traits;

use Illuminate\Database\Eloquent\SoftDeletes;
use Exception;

/**
 * @mixin \Illuminate\Database\Eloquent\Model
 * @property string|null $deleted_reason
 * @method bool save(array $options = [])
 * @method bool|null delete()
 */
trait SoftDeletesWithReason
{
    use SoftDeletes;

    /**
     * Perform a soft delete with a mandatory reason.
     *
     * @param string $reason
     * @return bool|null
     * @throws Exception
     */
    public function deleteWithReason(string $reason)
    {
        if (empty(trim($reason))) {
            throw new Exception('Soft delete requires a reason.');
        }

        $this->deleted_reason = $reason;
        $this->save();

        return $this->delete();
    }
}
