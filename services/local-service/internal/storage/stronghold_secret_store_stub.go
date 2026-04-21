//go:build !windows

package storage

func protectStrongholdBytes([]byte) ([]byte, error) {
	return nil, ErrStrongholdUnavailable
}

func unprotectStrongholdBytes([]byte) ([]byte, error) {
	return nil, ErrStrongholdUnavailable
}
