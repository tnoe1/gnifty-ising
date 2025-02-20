# Gnifty-Ising

An implementation of the 2D Lenz-Ising model. This implementation currently
uses a simplified version of the Hamiltonian that assumes constant interaction 
between neighbors and no external magnetic field.

$$H(\mathbf{S})=-J\sum_{i,j}s_{i}s_{j}$$

### TODO:
- [x] Implement state histogram streaming
- [x] Implement theoretical state histogram
- [x] Implement autocorrelation time sweep
- [ ] Implement Wolff and Worm algorithms to reduce critical slowing down
