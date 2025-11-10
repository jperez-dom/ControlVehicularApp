<?php

namespace App\Repository;

use App\Entity\ArrivalPass;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<ArrivalPass>
 *
 * @method ArrivalPass|null find($id, $lockMode = null, $lockVersion = null)
 * @method ArrivalPass|null findOneBy(array $criteria, array $orderBy = null)
 * @method ArrivalPass[]    findAll()
 * @method ArrivalPass[]    findBy(array $criteria, array $orderBy = null, $limit = null, $offset = null)
 */
class ArrivalPassRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, ArrivalPass::class);
    }

//    /**
//     * @return ArrivalPass[] Returns an array of ArrivalPass objects
//     */
//    public function findByExampleField($value): array
//    {
//        return $this->createQueryBuilder('a')
//            ->andWhere('a.exampleField = :val')
//            ->setParameter('val', $value)
//            ->orderBy('a.id', 'ASC')
//            ->setMaxResults(10)
//            ->getQuery()
//            ->getResult()
//        ;
//    }

//    public function findOneBySomeField($value): ?ArrivalPass
//    {
//        return $this->createQueryBuilder('a')
//            ->andWhere('a.exampleField = :val')
//            ->setParameter('val', $value)
//            ->getQuery()
//            ->getOneOrNullResult()
//        ;
//    }
}
